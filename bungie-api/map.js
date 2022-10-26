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
        refkeylocale.shift();
        refkeylocale.shift();
        return this.ProcessJSONLevel(data, schema, [{ref:refkeylocale[0]}]);
    }
    SearchConfigParameter(keylist, parameter, schema){

    }
    transform(data, configlocation, xtypeheaders){
        if(this.config.condense){
            if(data.data){ return data.data; }
            if(data.items){ return data.items; }
        }
        if(xtypeheaders["x-mapped-definition"]){
            //reverse search through the configlocation array for a x-mapped definition parameter. If found, use it, if not, assume no mapping.
            // Idea is, if we're in DestinyItemDefinition/itemHash, and we didn't specify to map it in /itemHash, check /DestinyItemDefinition to see if we specified it there.
            // That way, the config object can define on any level what should/shouldn't be hashmapped, and lets me control exactly what i want hashed.
            let shouldbemapped = this.SearchConfigParameter(configlocation, "x-mapped-definition", this.schema);
            if(shouldbemapped){
                //change the mapped value to an object, with keys id and data.
                // Add a check later in this function that checks children for this combo, and pulls the data out if true
                // that way the parent ends up storing data as "mapped" key, and the hash will still only return the hash.
                console.log("Result of x-mapped: "+shouldbemapped);
                data = {id: data, mapped: true };
            }
        }
        if(xtypeheaders["x-enum-reference"]){
            // Do reverse search here too. This will also be true/false, true returns identifier, false returns numericValue. default to false
            let shouldbemapped = this.SearchConfigParameter(configlocation, "x-enum-values", this.schema);
            console.log("Found x-enum: "+shouldbemapped);
            data = { id: data, isenum: shouldbemapped } //getXEnumReference(data, xtypeheaders["x-enum-reference"], shouldbemapped);
        }
        //This one doesn't use SearchConfigParameter because we only want to look for transform in this config
        let customtransform = traverseObject([...configlocation, "transform"], this.config)[0];
        if(customtransform)
            return customtransform(data);
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
let map = new DataMap();
let result = map.start(request_object, data, config_object);
let test = JSON.stringify(result);
const fs = require('fs');
fs.writeFile("map.json", test, (err) => console.log("success!"));

module.exports = DataMap;