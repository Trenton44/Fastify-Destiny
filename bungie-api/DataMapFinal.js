const api_doc = require("./openapi.json");
const Definitions = require("./manifest/en/world_content.json");

class DataController {
    constructor(language){
        this.Definitions = require("./manifest/"+language+"/world_content.json");
    }
    setConfig(config){ this.config = config; }
    #GroupArrayByKey(data, key){
        let temp = {};
        data.forEach( (element) => {
            if(!element[key]){
                if(!temp["unsorted"]){ temp["unsorted"] = []; }
                temp["unsorted"].push(element);
                return;
            }
            if(!temp[element[key]])
                temp[element[key]] = [];
            temp[element[key]].push(element);
        });
        return temp;
    }
    #groupObjectsBySimilarKeys(data){
        let temp = {};
        let grouped = {};
        for(prop in data){
            if(!data[prop]){
                grouped[prop] = data[prop];
                continue;
            }
                
            let keys = Object.keys(data[prop]);
            keys.forEach( (element) => {
                if(!temp[element])
                    temp[element] = [];
                temp[element].push(prop);
            });
        }
        for(prop in temp){
            if(temp[prop].length <= 1){
                let original_key = temp[prop][0];
                grouped[original_key] = data[original_key];
            }
            else{
                grouped[prop] = {};
                temp[prop].forEach( (element) => {
                    grouped[prop][element] = data[element][prop];
                    delete data[element][prop];
                });
            }
        }
        return grouped;
    }
    traverseObject(keylist, obj){
        try{ keylist.forEach( (key) => { obj = obj[key]; }); }
        catch{ return false; }
        if(obj == undefined){ return false; }
        return obj;
    }
    parseSchemaRef(ref_link, delimiter){
        if(!delimiter) { delimiter = "/"; }  //local schema ref's use /, so defaulting to it.
        let link_array = ref_link.split(delimiter);
        if(link_array[0] === "#") { return link_array.slice(1); } //return without leading # if it exists
        return link_array;
    }
    findSchema(keylist, schema){
        let obj = this.traverseObject(keylist, schema);
        let isref = this.traverseObject(["$ref"], obj);
        if(!isref)
            return [keylist, false];
        let path = this.parseSchemaRef(isref);
        return [path, true];
    }
    customTransformations(keylist, data){
        //custom transformation specifed in this.config that should be done on this data. created on an endpoint basis
        let keys = keylist.slice(0);
        keys.push("transform");
        let reference = this.traverseObject(keys, this.config);
        if(!reference)
            return data;
        return reference(data);

    }
    ProcessGrouped(data, keylist, xtypeheaders){
        if(xtypeheaders["x-destiny-component-type-dependency"]){
        }
        if(xtypeheaders["x-enum-reference"]){

        }
    }
    ProcessBasic(data, keylist, xtypeheaders){
        //check config flag, to see if x-map-definitions should be mapped
        if(this.config["x-mapped-definition"]){
            let xmapref = parseSchemaRef(xtypeheaders["x-mapped-definition"]["$ref"]);
            if(xmapref){
                let xmapkeylist = parseSchemaRef(xmapref[xmapref.length - 1], ".");
                let definitionkeylist = xmapkeylist.pop();
                definitionkeylist.push(data);
                //do customtransformations on both hashid and mapped data.
            }
        }
    }
}

class DataMap {
    constructor(schema, data, controller, language){
        this.xtypeheaders = ["x-mapped-definition", "x-mobile-manifest-name", "x-enum-values", "x-destiny-component-type-dependency", "x-dictionary-key", "x-preview", "x-enum-reference"];
        this.schema = schema;
        this.data = data;
        this.controller = new DataController("en");
    }
    #getXTypeHeaders(schema_obj){
        let keys = Object.keys(schema_obj);
        let results = {};
        this.xtypeheaders.forEach( (element) => {
            results[element] = false;
            keys.forEach( (current) => {
                if(element == current)
                    results[element] = schema_obj[current];
            })
        });
        return results;
    }
    getPathSchema(openapilink, response_code, request_type){
        let keys = ["paths", openapilink, request_type, "responses", response_code];
        let [nextkeys, isref] = this.controller.findSchema(keys, this.schema);
        let schema = this.controller.traverseObject(nextkeys, this.schema);
        keys = ["content", "application/json", "schema","properties", "Response"];
        [nextkeys, isref] = this.controller.findSchema(keys, schema);
        return nextkeys;
    }
    start(request, data, config){
        this.data = data;
        this.controller.setConfig(config);
        let schemakeylist = this.getPathSchema(request.link, request.code, request.type);
        return this.#ProcessJSONLevel([], schemakeylist);
    }
    #ProcessJSONLevel(datakeylist, schemakeylist) {
        let xtypeheaders = this.#getXTypeHeaders(this.controller.traverseObject(schemakeylist, this.schema)); //may need to fetch this in all the subtypes
        let nextdata = this.controller.traverseObject(datakeylist, this.data);
        let nextschema = this.controller.traverseObject(schemakeylist, this.schema);
        switch(nextschema.type){
            case "object": {
                if(nextschema.properties){
                    let [newschemakeylist, isref] = this.controller.findSchema([...schemakeylist, "properties"], this.schema);
                    let keys = Object.keys(nextdata);
                    let results = {};
                    keys.forEach( (element) => {
                        let [thisschemakeylist, isref] = this.controller.findSchema([...newschemakeylist, element]);
                        if(!isref){
                            if(!thisschemakeylist && xtypeheaders["x-dictionary-key"])
                                thisschemakeylist.push(Object.keys(this.controller.findSchema(thisschemakeylist))[0], this.schema);
                            else
                                results[element] = this.controller.traverseObject([...datakeylist, element], this.data);
                        }
                        results[element] = this.#ProcessJSONLevel([...datakeylist, element], thisschemakeylist);
                    });
                    results = this.controller.transform(results, newschemakeylist, xtypeheaders);
                    return results;
                }
                else if(nextschema.additionalProperties){
                     //finds additionalProperties, and returns schemakeylist with added "additionalProperties." check for $ref, and if found, return that new keylist instead. 
                    let [newschemakeylist, isref] = this.controller.findSchema([...schemakeylist, "additionalProperties"], this.schema);
                    let results = {};
                    Object.keys(nextdata).forEach( (property) => { results[property] = this.#ProcessJSONLevel([...datakeylist, property], newschemakeylist); });
                    results = this.controller.transform(results, newschemakeylist, xtypeheaders);
                    return results;
                }
                else if(nextschema.allOf){
                    let [newschemakeylist, isref] = this.controller.findSchema([...schemakeylist, "allOf", 0], this.schema);
                    if(!isref)
                        throw Error("First instance of allOf without a $ref, don't currently support this.");
                    let results = this.#ProcessJSONLevel(datakeylist, newschemakeylist);
                    return this.controller.transform(results, newschemakeylist, xtypeheaders);
                }
            }
            case "array": {
                let [newschemakeylist, isref] = this.controller.findSchema([...schemakeylist, "items"], this.schema);
                let results = nextdata.map( (current, index) => { return this.#ProcessJSONLevel([...datakeylist, index], newschemakeylist, isref); });
                results = this.controller.transform(results, newschemakeylist, xtypeheaders);
                return results;
            }
            default: {
                return this.controller.transform(nextdata, schemakeylist, xtypeheaders);
            }
        }
    }
}
const data = require("../env-files/profileData.json");
//const config_objects = require('./backendTransformations.js');
request_object = {
    link: "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/",
    type: "get",
    code: "200",
};

let datamap = new DataMap(api_doc);

let final = datamap.start(request_object, data);
let test = JSON.stringify(final);
const fs = require('fs');
fs.writeFile("keybasedData.json", test, (err) => console.log("success!"));

module.exports = DataMap;