const guide = require("./json-schema-controller.js");
const NodeController = require("./nodecontroller.js");
const Node = require("./node.js");

class DataMap {
    constructor(manifest){
        this.config = {};
        this.nodes = new NodeController(this.config);
        this.defintion = manifest;
    }
    setConfig(config){
        this.config = config;
        this.nodes.config = config;
    }
    start(request, data, config){
        this.setConfig(config);
        let [schema, refkeylocale] = guide.findPathSchema(request.link, request.code, request.type);
        refkeylocale = refkeylocale.pop();
        this.nodes.root = new Node(null, refkeylocale, schema, { ref: this.config[refkeylocale] });
        this.ProcessJSONLevel(data, schema, this.config[refkeylocale], this.nodes.root);
        let result = this.nodes.compileTree();
        return result;
    }
    buildConfig(config, ref=false, dependency=false){
        if(ref){
            ref = ref.pop(); //just get the part relevant to components.schemas
            ref = guide.traverseObject([ref], this.config);
        }
        if(dependency)
            dependency = guide.traverseObject(dependency, this.config);
        return {
            property: config,
            ref: ref,
            dependency: dependency
        };
    }
    ProcessJSONLevel(data, schema, config, node){
        switch(schema.type){
            case "object": {
                if(schema.properties){
                    Object.keys(data).forEach( (property) => {
                        let [ nodeschema, schemaref ] = guide.findSchema(["properties", property], schema);
                        if(!schemaref && !nodeschema){
                            let nextnode = new Node(null, property, false, false, this.defintion)
                            this.nodes.addNode(node, nextnode);
                            temp.data = data[property];
                            return false;
                        }
                        let nodeconfig = this.buildConfig(guide.traverseObject([ property ], config), schemaref);
                        let nextnode = new Node(null, property, nodeschema, nodeconfig, this.defintion);
                        this.nodes.addNode(node, nextnode);
                        this.ProcessJSONLevel(data[property], nodeschema, nodeconfig.property, nextnode);
                    });
                }
                else if(schema.additionalProperties){
                    let [ nodeschema, schemaref ] = guide.findSchema(["additionalProperties"], schema);
                    Object.keys(data).forEach( (property) => {
                        let nodeconfig = this.buildConfig(guide.traverseObject([ property ], config), schemaref);
                        let nextnode = new Node(null, property, nodeschema, nodeconfig, this.defintion);
                        this.nodes.addNode(node, nextnode);
                        this.ProcessJSONLevel(data[property], nodeschema, nodeconfig.property, nextnode);
                    });
                }
                else if (schema.allOf){
                    let [ nodeschema, schemaref ] = guide.findSchema(["allOf", 0], schema);
                    //  may need to come back and add schemaref/allOf to the config here
                    this.ProcessJSONLevel(data, nodeschema, config, node);
                }
                else{ throw Error("This object has no properties, God help us all."); }
                return true;
            }
            case "array": {
                let [ nodeschema, schemaref ] = guide.findSchema(["items"], schema);
                //  may need to come back and add items to the config here
                let nodeconfig = this.buildConfig(guide.traverseObject(["items"], config), schemaref);
                data.forEach( (current, index) => {
                    let nextnode = new Node(null, index, nodeschema, nodeconfig, this.defintion);
                    this.nodes.addNode(node, nextnode);
                    this.ProcessJSONLevel(current, nodeschema, nodeconfig.property, nextnode);
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
    "condense": true,
    "Destiny.Responses.DestinyProfileResponse": {
        "x-mapped-definition": true,
        "x-enum-values": true,
        "transform": function(data) {
            return data;
        },
        "group": {
            "characterdata": ["characters", "characterInventories", "characterProgressions", "characterRenderData", "characterActivities", "characterEquipment", "characterKiosks", "characterPlugSets", "characterPresentationNodes", "characterRecords", "characterCollectibles", "characterStringVariables", "characterCraftables", "characterCurrencyLookups"],
            "profiledata": ["profileInventory", "profileCurrencies", "profile", "platformSilver", "profileKiosks", "profilePlugSets", "profileProgression", "profilePresentationNodes", "profileRecords", "profileCollectibles", "profileTransitoryData", "profileStringVariables"]
        }
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

let map = new DataMap(definitions);
map.start(request_object, data, config_object);
let result = map.recompile();
const fs = require('fs');
fs.writeFile("nodemap.json", JSON.stringify(result), (err) => console.log("success!"));
//console.log(result);
*/
module.exports = DataMap;