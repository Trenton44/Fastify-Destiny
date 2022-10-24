const api_doc = require("./openapi.json");
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


class DataMap {
    constructor(){
        this.config = {};
    }
    setConfig(configObj){
        if(!configObj)
            throw Error("No config object was passed.");
        this.config = configObj;
        return true;
    }
    start(requestobj, data, config){
        let [schema, refkeylocale] = getPathSchema(requestobj.link, requestobj.code, requestobj.type);
        if(config){ this.setConfig(config); }
        return this.ProcessJSONLevel(data, schema, refkeylocale);
    }
    SearchConfigForParameter(locationkeyist, parameter){
        let schemalevel = [];
        let temp = this.config;
        for(let key of locationkeyist){
            if(temp == undefined){ break; }
            schemalevel.unshift(temp); //Add them in reverse order, to check the bottom level first.
            temp = temp[key];
            //look at next level. if there's no level, stop searching
            
        }
        for(let level of schemalevel){
            if(level[parameter] != undefined){
                console.log("FOUND PARAMETER AT "+level);
                return level[parameter];
            }
                
        }
        return false;

    }
    getNextParts(searchkeylist, schema, configlocation){
        let [nextschema, refkeys] = findSchema(searchkeylist, schema);
        if(refkeys)
            return [ nextschema, refkeys, true ];
        else
            return[ nextschema, configlocation.slice(0), false];
    }
    transform(data, configlocation, xtypeheaders){
        if(this.config.condenseAPI){
            if(data.data){ return data.data; }
            if(data.items){ return data.items; }
        }
        if(xtypeheaders["x-mapped-definition"]){
            //reverse search through the configlocation array for a x-mapped definition parameter. If found, use it, if not, assume no mapping.
            // Idea is, if we're in DestinyItemDefinition/itemHash, and we didn't specify to map it in /itemHash, check /DestinyItemDefinition to see if we specified it there.
            // That way, the config object can define on any level what should/shouldn't be hashmapped, and lets me control exactly what i want hashed.
            let shouldbemapped = this.SearchConfigForParameter(configlocation, "x-mapped-definition");
            if(shouldbemapped){
                //change the mapped value to an object, with keys id and data.
                // Add a check later in this function that checks children for this combo, and pulls the data out if true
                // that way the parent ends up storing data as "mapped" key, and the hash will still only return the hash.
                data = {id: data, mapped: true };
            }
        }
        if(xtypeheaders["x-enum-reference"]){
            // Do reverse search here too. This will also be true/false, true returns identifier, false returns numericValue. default to false
            let shouldbemapped = this.SearchConfigForParameter(configlocation, "x-mapped-definition");
            data = { id: data, isenum: true } //getXEnumReference(data, xtypeheaders["x-enum-reference"], shouldbemapped);
        }
        //This one doesn't use SearchConfigForParameter because we only want to look for transform in this config
        let customtransform = traverseObject([...configlocation, "transform"], this.config)[0];
        if(customtransform)
            return customtransform(data);
        return data;
    }
    ProcessJSONLevel(data, schema, configlocation) {
        let xtypeheaders = getXTypeHeaders(schema);
        switch(schema.type){
            case "object":
                if(schema.properties){
                    let result = {};
                    Object.keys(data).forEach( (property) => {
                        let [nextschema, nextconfiglocation, isref] = this.getNextParts(["properties", property], schema, configlocation);
                        if(!isref && !nextschema)
                            result[property] = data[property]; //item doesn't exist in openapi documentation, so just return as-is
                        else
                        result[property] = this.ProcessJSONLevel(data[property], nextschema, nextconfiglocation);
                    });
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else if(schema.additionalProperties){
                    let [nextschema, nextconfiglocation] = this.getNextParts(["additionalProperties"], schema, configlocation);
                    let result = {};
                    Object.keys(data).forEach( (property) => { 
                        result[property] = this.ProcessJSONLevel(data[property], nextschema, nextconfiglocation);
                    });
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else if(schema.allOf){
                    let [nextschema, nextconfiglocation] = this.getNextParts(["allOf", 0], schema, configlocation);
                    let result = this.ProcessJSONLevel(data, nextschema, nextconfiglocation);
                    return this.transform(result, configlocation, xtypeheaders);
                }
                else
                    throw Error("This object has no properties, God help us all.");
            case "array": {
                let [nextschema, nextconfiglocation] = this.getNextParts(["items"], schema, configlocation);
                let result = [];
                data.forEach( (current, index) => { result.push(this.ProcessJSONLevel(current, nextschema, nextconfiglocation)); });
                return this.transform(result, configlocation, xtypeheaders);
            }
            default: {
                let result = data;
                return this.transform(result, configlocation, xtypeheaders);
            }
        }
    }
}


const data = require("../env-files/profileData.json");
let config_object = {
      //must be true/false. if true, map hashes to their definitions
    "x-enum-values": true, //must be true/false. if true, returns the "numericValue" of the enum. if false, returns the "identifier" (that's how the bungie api stores these. it will return identifier if null)
    "condenseAPI": true,
    "components": {
        "schemas": {
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
                "x-mapped-definition": true,
            }
        }
    }
};
request_object = {
    link: "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/",
    type: "get",
    code: "200",
};
let map = new DataMap();
let result = map.start(request_object, data, config_object);
let test = JSON.stringify(result);
const fs = require('fs');
fs.writeFile("map.json", test, (err) => console.log("success!"));

module.exports = DataMap;