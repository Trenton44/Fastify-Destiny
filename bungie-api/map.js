const api_doc = require("./openapi.json");
const formatter = require("./transform.js");
const xtypeheaders = ["x-mapped-definition", "x-mobile-manifest-name", "x-enum-values", "x-destiny-component-type-dependency", "x-dictionary-key", "x-preview", "x-enum-reference"];

// At the end of the day, I need ONE of the following:
//  data, schema, config, this schema's location (minus json schema keywords, like .items)
// a class holding config state, function passes data, schema, schema location (minus keywords)
// datakeylist, schemakeylist, a class holding data and schema state
function traverseObject(keylist, obj){
    try{ keylist.forEach( (key) => { obj = obj[key]; }); }
    catch{ return false; }
    if(obj == undefined){ return false; }
    return obj;
}
function parseSchemaRef(ref_link, delimiter){
    if(!delimiter) { delimiter = "/"; }  //local schema ref's use /, so defaulting to it.
    let link_array = ref_link.split(delimiter);
    if(link_array[0] === "#") { return link_array.slice(1); } //return without leading # if it exists
    return link_array;
}

//searches through a json schema with the given keylist.
//returns the found schema, and if that schema contained a $ref to another schema, returns the keylist to reach that schema
function findSchema(keylist, schema){
    let obj = traverseObject(keylist, schema);
    if(!obj){ return [false, false]; }
    let isref = traverseObject(["$ref"], obj);
    if(!isref){ return [obj, false]; }
    let path = parseSchemaRef(isref);
    obj = traverseObject(path, api_doc);
    return [obj, path];
}

function getPathSchema(openapilink, code, requesttype){
    let keys = ["paths", openapilink, requesttype, "responses", code];
    let [schema, refkeys] = findSchema(keys, api_doc);
    keys = ["content", "application/json", "schema","properties", "Response"];
    [schema, refkeys] = findSchema(keys, schema);
    return [schema, refkeys];
    //find this schema as well, and return it. if it is a $ref (if not a $ref, it's in the same schema, so we just use those keys)
}

function getXTypeHeaders(schema_obj){
    let keys = Object.keys(schema_obj);
    let results = {};
    xtypeheaders.forEach( (element) => {
        results[element] = false;
        keys.forEach( (current) => {
            if(element == current)
                results[element] = schema_obj[current];
        })
    });
    return results;
}

function getXEnumReferences(data, xenumheader, returntype){
    let keylist = parseSchemaRef(xenumheader["$ref"]);
    let xenumschema = traverseObject(keylist, api_doc);
    if(!xenumschema)
        return data;
    for(let element of xenumschema["x-enum-values"]){
        if(element.numericValue == data){
            if(returntype){ return element.identifier; }
            else{ return element.numericValue; }
        }
    }
}
function getXMapped(data, xmapheader, definition){
    let keys = parseSchemaRef(xmapheader["$ref"]);
    if(!keys){ return data; }
    let defkeys = parseSchemaRef(keys[keys.length - 1], ".");
    defkeys = defkeys.slice(defkeys.length - 1);
    if(typeof data === "object"){
        if(data instanceof Array)
            return data; //Arrays of hashes are usually things like DestinySeasonDefinition, we don't want to map those.
        Object.keys(data).forEach( (element) => { data[element].mapped = traverseObject([...defkeys, element], definition) });
    }
    else {
        return {
            id: data,
            data: traverseObject([...defkeys, data], definition)
        }
    }
    return data; //return original by default
}



class DataMap {
    constructor(definition){
        this.config = {};
        if(!definition){ throw Error("A Bungie API Manifest is required."); }
        this.definition = definition;
    }
    setConfig(configObj){
        if(!configObj){ throw Error("No config object was passed."); }
        this.config = configObj;
        return true;
    }
    start(requestobj, data, config){
        let [schema, refkeylocale] = getPathSchema(requestobj.link, requestobj.code, requestobj.type);
        if(config){ this.setConfig(config); }
        refkeylocale.shift();
        refkeylocale.shift();
        return this.ProcessJSONLevel(data, schema, [{ property:refkeylocale[0] }]);
    }
    SearchConfigParameter(keylist, schema, parameter, counter=0){
        //console.log("Checking "+counter+": "+keylist.toString());
        keylist = keylist.slice(0);
        if(schema == undefined){ return undefined; }
        //console.log(keylist);
        //console.log(schema);
        let validkeys = {};
        let keys = keylist.shift();
        for(let key in keys){
            if(schema[keys[key]] != undefined)
            validkeys[key] = schema[keys[key]];
        }
        let validpaths = {};
        //console.log(counter+": checking child paths: ");
        for(let key in validkeys){
            let temp = this.SearchConfigParameter(keylist, validkeys[key], parameter, counter+1);
            if(temp != undefined)
                validpaths[key] = temp;
        }
        //console.log(validpaths);
        if(Object.keys(validpaths).length == 0){
            //console.log("There are no more valid paths, start checking recursively for the value.");
            //console.log("return value: "+schema[parameter]);
            return schema[parameter];
        }
        else{
            //console.log("A VALID PATH HAS BEEN FOUND SOMEWHERE BELOW "+counter);
            //console.log(validpaths);
            if(validpaths["property"] != undefined){ return validpaths["property"]; }
            if(validpaths["ref"] != undefined){ return validpaths["ref"]; }
            if(validpaths["dependency"] != undefined){ return validpaths["dependency"]; }
            //console.log("You lied to me.");
            return undefined;
        }
    }
    getExactDataPath(configlocation){
        return configlocation.map( (element) => { return element.property; });
    }
    transform(data, configlocation, xtypeheaders){
        if(this.SearchConfigParameter(configlocation, this.config["components"]["schemas"], "condense")){
            if(data.data){ return data.data; }
            if(data.items){ return data.items; }
        }
        if(xtypeheaders["x-mapped-definition"]){
            let shouldbemapped = this.SearchConfigParameter(configlocation, this.config["components"]["schemas"], "x-mapped-definition");
            if(shouldbemapped)
                data = getXMapped(data, xtypeheaders["x-mapped-definition"], this.definition);
        }
        if(xtypeheaders["x-enum-reference"]){
            // Do reverse search here too. This will also be true/false, true returns identifier, false returns numericValue. default to false
            let shouldbemapped = this.SearchConfigParameter(configlocation, this.config["components"]["schemas"], "x-enum-values");
            //console.log("Found x-enum: "+shouldbemapped);
            data = getXEnumReferences(data, xtypeheaders["x-enum-reference"], shouldbemapped);
        }
        let directDataPath = this.getExactDataPath(configlocation);
        //This one doesn't use SearchConfigParameter because we only want to look for transform in this config
        let customoptions = traverseObject(directDataPath, this.config["components"]["schemas"]);
        data = formatter(data, customoptions);
        return data;
    }
    getNextParts(searchkeylist, schema){
        let [nextschema, refkeys] = findSchema(searchkeylist, schema);
        let isref = false;
        if(refkeys){
            refkeys.shift();
            refkeys.shift();
            isref = refkeys[0];
        }
        return[ nextschema, isref ];
    }
    ProcessJSONLevel(data, schema, configlocation){
        let xtypeheaders = getXTypeHeaders(schema);
        let result = {};
        switch(schema.type){
            case "object":
                if(schema.properties){
                    let result = {};
                    Object.keys(data).forEach( (property) => {
                        let [nextschema, isref] = this.getNextParts(["properties", property], schema);
                        let nextc = {};
                        if(isref){ nextc.ref = isref }
                        if(xtypeheaders["x-mapped-definition"]){ nextc.dependency = xtypeheaders["x-mapped-definition"]; }
                        nextc.property = property;
                        let nextconfiglocation = [...configlocation, nextc];
                        if(!isref && !nextschema)
                            result[property] = data[property]; //item doesn't exist in openapi documentation, so just return as-is
                        else
                            result[property] = this.ProcessJSONLevel(data[property], nextschema, nextconfiglocation);
                    });
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else if(schema.additionalProperties){
                    let [nextschema, isref] = this.getNextParts(["additionalProperties"], schema);
                    if(isref){ configlocation[configlocation.length - 1].ref = isref; }
                    let result = {};
                    Object.keys(data).forEach( (property) => { 
                        result[property] = this.ProcessJSONLevel(data[property], nextschema, configlocation);
                    });
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else if(schema.allOf){
                    let [nextschema, isref] = this.getNextParts(["allOf", 0], schema);
                    if(isref){ configlocation[configlocation.length - 1].ref = isref; }
                    let result = this.ProcessJSONLevel(data, nextschema, configlocation);
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else
                    throw Error("This object has no properties, God help us all.");
            case "array": {
                let [nextschema, isref] = this.getNextParts(["items"], schema);
                if(isref){ configlocation[configlocation.length - 1].ref = isref; }
                let result = [];
                data.forEach( (current, index) => { result.push(this.ProcessJSONLevel(current, nextschema, configlocation)); });
                return this.transform(result, configlocation, xtypeheaders);
            }
            default:
                let result = data;
                return this.transform(result, configlocation, xtypeheaders);
        }
    }
}

const definitions = require("./manifest/en/world_content.json");
const data = require("../env-files/profileData.json");
let config_object = {
    "components": {
        "schemas": {
            "condense": true,
            "x-mapped-definition": true,
            "x-enum-values": true,
            "Destiny.Responses.DestinyProfileResponse": {
                "profileInventory": {
                    "x-enum-values": false,
                },
                "transform": function(data) {
                    console.log("Made it here!");
                    return data;
                },
            },
            "Destiny.Entities.Items.DestinyItemComponent": {
                
            },
            "SingleComponentResponseOfDestinyInventoryComponent": {
                "x-mapped-definition": false
            },
        }
    }
};
request_object = {
    link: "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/",
    type: "get",
    code: "200",
};
let map = new DataMap(definitions);
let result = map.start(request_object, data, config_object);
let test = JSON.stringify(result);
const fs = require('fs');
fs.writeFile("map.json", test, (err) => console.log("success!"));

module.exports = DataMap;