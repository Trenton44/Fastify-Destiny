const guide = require("./json-schema-controller.js");
const NodeController = require("./nodecontroller.js");
const Node = require("./node.js");

// keywords supported through the config object, custom to this application
// NOTE: THE ORDER OF THESE IS VERY IMPORTANT, THIS APPLIES TO ALL ARRAYS BELOW
// the order of items in these arrays is the order that transformfunctions will be added, and subsequently applied, to node data
const serverkeywords = [ "filter", "group", "link" ];
// keywords supported through the config object, that appear in the bungie openapi json schema
const schemakeywords = [ "x-mapped-definition", "x-enum-reference" ];

// keywords that will appear in the config and need to be checked for and passed to the node
const configkeywords = [ ...schemakeywords, ...serverkeywords ];

// keywords that appear in the above, but have values that should/can be inherited from parent nodes

const inheritablekeywords = [ "x-mapped-definition", "x-enum-reference" ];

// keywords that have a valid use case, but not via a transformation function
// these are used elsewhere, and don't have a transform function explicitly. 
// Example: "link" keywords is applied via NodeController, and not within the node's transformation functions
const skipkeywords = [ "link" ];

const transformFunctions = {
    /**
     * Nodes with the "x-mapped-definition" keyword enabled process their data using this function
     * @function x-mapped-definition
     * @memberof BuildTransform
     * @inner
     * @private
     * @param {Node} node - Node instance
     * @returns {boolean}
     */
    "x-mapped-definition": function(node){
        let xdatanode = new Node(node.key+"Mapped");
        let xmapdata = guide.traverseObject([this.data.keys, node.data], this.data.data);
        xdatanode.data = xmapdata;
        node.parent.addChild(xdatanode);
        return true;
    },
    /**
     * Nodes with the "x-enum-reference" keyword enabled process their data using this function
     * @function x-enum-reference
     * @memberof BuildTransform
     * @inner
     * @private
     * @param {Node} node - Node instance
     * @returns {boolean}
     */
    "x-enum-reference": function(node){
        let keypair = this.data.find( (pairs) => pairs.numericValue == node.data);
        if(keypair == undefined){ return false; }
        node.data = keypair.identifier;
        return true;
    },
    /**
     * Nodes with the "filter" keyword enabled process their data using this function
     * @function filter
     * @memberof BuildTransform
     * @inner
     * @private
     * @param {Node} node - Node instance
     * @returns {boolean}
     */
    "filter": function(node){
        //filter out all keys that arent' in the filter list
        node.children.forEach( (child) =>{
            let stays = this.data.find( (key) => child.key == key);
            if(stays == undefined)
                child.delete();
        });
        return true;
    },
    /**
     * Nodes with the "group" keyword enabled process their data using this function
     * @function group
     * @memberof BuildTransform
     * @inner
     * @private
     * @param {Node} node - Node instance
     * @returns {boolean}
     */
    "group": function(node){
        Object.entries(this.data).forEach( ([key, arr]) => {
            let groupnode = new Node(key, false);
            let children = node.children.filter( (child) => arr.find( (arrkey) => child.key == arrkey));
            node.children = node.children.filter( (child) => children.find((groupchild) => groupchild == child) == undefined);
            children.forEach( (child) => groupnode.addChild(child));
            node.addChild(groupnode);
        });
        return true;
    },
};

/**
 * Creates an object that contains a function, and data necessary for the function to operate.
 * @link DataMap uses this to pass transformation functions into @link Node instances
 * @class BuildTransform
 * @param {string} key - the @see Options keyword whose function will be saved in this instance
 * @param {Object} data - Various, key-specific pieces of data necessary for the function to process @see Node data correctly
 */
class BuildTransform {
    constructor(key, data){
        /** @property data - the data used for transform */
        this.data = data;
        /** @property transform - Contains a reference to a private function of @see BuildTransform */
        this.transform = transformFunctions[key].bind(this);
    }
}

/**
 * Creates a new DataMap instance
 * @class DataMap
 * @param { Object } Manifest - A D2 API manifest file
 * @param { Object } config - A @see {@link Config} Object
 */
class DataMap {
    constructor(manifest, config={}){
        this.config = config;
        if(!(manifest instanceof Object))
            throw Error("DataMap instance requires a manifest object.");
        this.manifest = manifest;
    }
    
    /**
     * 
     * @param {Object} request - An object containing necessary info about the api request
     * @param {string} request.link - the corresponding open api link of the endpoint the request was made to
     * @param {number} [request.code=200] - the status code of the response
     * @param {string} [request.type=application/json] - the format type of the response
     * @param {Object} data - the response data of the API request
     * @param {Object} config - the config object specified for this server's endpoint (the one you made the request from) 
     * @returns {Object} - The data processed and formatted according to the config
     */
    start(request, data, config){
        let nodes = new NodeController(config);
        let [schema, refkeylocale] = guide.findPathSchema(request.link, request.code, request.type);
        if(!schema){ throw Error("No schema was found for the given request endpoint."); }
        refkeylocale = [ refkeylocale.pop() ];
        let options = this.buildCustomOptions(refkeylocale);
        let nodefunctions = this.getTransformFunctions(options, schema);
        nodes.root = new Node("", options, nodefunctions);
        this.ProcessJSONLevel(data, schema, refkeylocale, nodes.root);
        return nodes;
    }
    getTransformFunctions(options, schema){
        let functions = [];
        // look through all possible custom keywords used in the bungie openapi.
        schemakeywords.forEach( (key) => {
            if(options[key] && schema[key]){
                switch(key){
                    case "x-enum-reference":
                        let keylist = guide.parseSchemaRef(schema["x-enum-reference"]["$ref"]);
                        let xenumvalues = guide.findSchema(keylist)[0]["x-enum-values"];
                        functions.push(new BuildTransform(key, xenumvalues))
                        break;
                    case "x-mapped-definition":
                        let keys = guide.parseSchemaRef(schema["x-mapped-definition"]["$ref"]);
                        keys = guide.parseSchemaRef(keys.pop(), ".").pop(); // split the last item of keys by ".", and return the last item of the result
                        functions.push(new BuildTransform(key, { keys: keys, data: this.manifest }));
                        break;
                }
            }
        });
        serverkeywords.forEach( (key) => {
            // if server keyword is on the list of keys to skip, ignore it and do the next key.
            if(skipkeywords.find( (skipkey) => key == skipkey) != undefined)
                return true;
            // if an options key is found, push the function
            if(options[key] != undefined)
                functions.push(new BuildTransform(key, options[key]));
        });
        return functions;
    }
    /**
     * 
     * @param {string[]} configkeys - keylist corresponding to the location in this.config
     * @param {string[]} refkeys - keylist corresponding to the location in this.config
     * @returns {Options} - option values available to the node in processing
     */
    buildCustomOptions(configkeys, refkeys){
        let ref = {};
        let config = {};
        if(configkeys instanceof Array)
            config = guide.traverseObject(configkeys, this.config);
        else { configkeys = []; }
        if(refkeys instanceof Array){
            refkeys = [refkeys[refkeys.length - 1]];
            ref = guide.traverseObject(refkeys, this.config);
        }
        else { refkeys = []; }
        let options = {};
        configkeywords.forEach( (key) => {
            if(ref[key] != undefined)
                options[key] = ref[key];
            if(config[key] != undefined)
                options[key] = config[key];
        });
        inheritablekeywords.forEach( (key) => {
            if(options[key] != undefined)
                return true; // we've already found it in this object, no need for recursive search.
            let copylist = [...configkeys];
            do {
                copylist.pop();
                let parentconfig = guide.traverseObject(copylist, this.config);
                if(!parentconfig)
                    continue; // didn't find a config at this point, go up a level
                if(parentconfig[key] != undefined){
                    //parent config had the key, set this to it and break from loop
                    options[key] = parentconfig[key];
                    break;
                }
            } while(copylist.length > 0);
            //If it wasn't found in this config, OR in parent configs, default to false
            if(options[key] == undefined)
                options[key] = false;
        });
        return options;
    }
    /**
     * A Recursive function for converting a data object into a Node Tree.
     * @param {Object} data - the data from the Destiny API response 
     * @param {Object} schema - the schema from the OpenApi spec corresponding to the response data
     * @param {Object} config - the config object corresponding to the endpoint this server made the request with
     * @param {Node} node - The parent Node for this data
     * @returns {boolean}
     */
    ProcessJSONLevel(data, schema, config, node){
        switch(schema.type){
            case "object": {
                if(schema.properties){
                    Object.keys(data).forEach( (property) => {
                        let [ nodeschema, schemaref ] = guide.findSchema(["properties", property], schema);
                        if(!schemaref && !nodeschema){
                            let nextnode = new Node(property, {});
                            node.addChild(nextnode);
                            nextnode.data = data[property];
                            return true;
                        }
                        let options = this.buildCustomOptions([...config, property], schemaref);
                        let nodefunctions = this.getTransformFunctions(options, nodeschema);
                        let nextnode = new Node(property, options, nodefunctions);
                        node.addChild(nextnode);
                        this.ProcessJSONLevel(data[property], nodeschema, [...config, property], nextnode);
                    });
                }
                else if(schema.additionalProperties){
                    let [ nodeschema, schemaref ] = guide.findSchema(["additionalProperties"], schema);
                    Object.keys(data).forEach( (property) => {
                        let options = this.buildCustomOptions([...config, property], schemaref);
                        let nodefunctions = this.getTransformFunctions(options, nodeschema);
                        let nextnode = new Node(property, options, nodefunctions);
                        node.addChild(nextnode);
                        this.ProcessJSONLevel(data[property], nodeschema, [...config, property], nextnode);
                    });
                }
                else if(schema.allOf){
                    let [ nodeschema, schemaref ] = guide.findSchema(["allOf", 0], schema);
                    //  may need to come back and add schemaref/allOf to the config here
                    this.ProcessJSONLevel(data, nodeschema, config, node);
                }
                else{ throw Error("This object has no properties, God help us all."); }
                return true;
            }
            case "array": {
                let [ nodeschema, schemaref ] = guide.findSchema(["items"], schema);
                let options = this.buildCustomOptions(config, schemaref);
                //  may need to come back and add items to the config here
                data.forEach( (current, index) => {
                    let nodefunctions = this.getTransformFunctions(options, nodeschema);
                    let nextnode = new Node(index, options, nodefunctions);
                    node.addChild(nextnode);
                    this.ProcessJSONLevel(current, nodeschema, config, nextnode);
                });
                return true;
            }
            default: {
                node.data = data;
                return true;
            }
        }
    }
}

/*
const definitions = require("./manifest/en/manifest.json");
const data = require("../env-files/profileData.json");
let config_object = {
    "splice": true,
    "x-enum-reference": false,
    "Destiny.Responses.DestinyProfileResponse": {
        "profileInventory":{},
        "x-mapped-definition": true,
        "transform": function(data) {
            return data;
        },
        "group": {
            "characterdata": ["characters", "characterInventories", "characterProgressions", "characterRenderData", "characterActivities", "characterEquipment", "characterKiosks", "characterPlugSets", "characterPresentationNodes", "characterRecords", "characterCollectibles", "characterStringVariables", "characterCraftables", "characterCurrencyLookups"],
            "profiledata": ["profileInventory", "profileCurrencies", "profile", "platformSilver", "profileKiosks", "profilePlugSets", "profileProgression", "profilePresentationNodes", "profileRecords", "profileCollectibles", "profileTransitoryData", "profileStringVariables"]
        }
    },
    "Destiny.Entities.Inventory.DestinyInventoryComponent": {
        "link": "key"
    },
    "Destiny.Entities.Characters.DestinyCharacterComponent":{
        "link": "key"
    },
    "Destiny.Entities.Characters.DestinyCharacterRenderComponent": {
        "link": "key"
    },
    "Destiny.Entities.Items.DestinyItemComponent": { 
        "filter": ["itemHash", "bucketHash", "itemHashMapped", "bucketHashMapped"]
    },
    "SingleComponentResponseOfDestinyInventoryComponent": {
        "x-mapped-definition": false
    },
};
request_object = {
    link: "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/",
    type: "get",
    code: "200",
};

let map = new DataMap(definitions, config_object);
result = map.start(request_object, data, config_object);
result = result.compileTree();
const fs = require('fs');
fs.writeFile("nodemap.json", JSON.stringify(result), (err) => console.log("success!"));*/
module.exports = DataMap;