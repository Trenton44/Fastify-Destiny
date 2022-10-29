const xtypeheaders = ["x-mapped-definition", "x-mobile-manifest-name", "x-enum-values", "x-destiny-component-type-dependency", "x-dictionary-key", "x-preview", "x-enum-reference"];
const formatter = require("./transform.js");
const jsonguide = require("./json-schema-controller.js");

function getXTypeHeaders(schema_obj){
    let keys = Object.keys(schema_obj);
    let results = {};
    xtypeheaders.forEach( (element) => {
        results[element] = false;
        keys.forEach( (current) => {
            if(element == current)
                results[element] = schema_obj[current];
        });
    });
    return results;
}

function getXEnumReferences(data, xenumheader, returntype){
    let keylist = jsonguide.parseSchemaRef(xenumheader["$ref"]);
    let xenumschema = jsonguide.findSchema(keylist)[0];
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
    let keys = jsonguide.parseSchemaRef(xmapheader["$ref"]);
    if(!keys){ return data; }
    let defkeys = jsonguide.parseSchemaRef(keys[keys.length - 1], ".");
    defkeys = defkeys.slice(defkeys.length - 1);
    if(typeof data === "object"){
        if(data instanceof Array)
            return data; //Arrays of hashes are usually things like DestinySeasonDefinition, we don't want to map those.
        Object.keys(data).forEach( (element) => { data[element].mapped = jsonguide.traverseObject([...defkeys, element], definition) });
    }
    else 
        return jsonguide.traverseObject([...defkeys, data], definition);
}



class DataMap {
    constructor(definition){
        this.config = {};
        if(!definition){ throw Error("A Bungie API Manifest is required."); }
        this.definition = definition;
        this.xdictionarymap = {};
    }
    setConfig(configObj){
        if(!configObj){ throw Error("No config object was passed."); }
        this.config = configObj;
        return true;
    }
    start(requestobj, data, config){
        let [schema, refkeylocale] = jsonguide.findPathSchema(requestobj.link, requestobj.code, requestobj.type);
        if(config){ this.setConfig(config); }
        refkeylocale.shift(); // remove "components"
        refkeylocale.shift(); // remove "schemas" (we want all locations to be relative to openapidoc["components"]["schemas"])
        let temp = this.ProcessJSONLevel(data, schema, [{ property: refkeylocale[0] }], []);
        console.log(this.xdictionarymap);
        return temp;
    }
    SearchConfigParameter(keylist, schema, parameter, counter=0){
        keylist = keylist.slice(0);
        if(schema == undefined){ return undefined; }
        let validkeys = {};
        let keys = keylist.shift();
        for(let key in keys){
            if(schema[keys[key]] != undefined)
            validkeys[key] = schema[keys[key]];
        }
        let validpaths = {};
        for(let key in validkeys){
            let temp = this.SearchConfigParameter(keylist, validkeys[key], parameter, counter+1);
            if(temp != undefined)
                validpaths[key] = temp;
        }
        if(Object.keys(validpaths).length == 0){
            return schema[parameter];
        }
        else{
            if(validpaths["property"] != undefined){ return validpaths["property"]; }
            if(validpaths["ref"] != undefined){ return validpaths["ref"]; }
            if(validpaths["dependency"] != undefined){ return validpaths["dependency"]; }
            return undefined;
        }
    }
    addDictionaryMap(exactlocation){
        let dictkey = exactlocation[ exactlocation.length - 1 ];
        if(!this.xdictionarymap[dictkey]){ this.xdictionarymap[dictkey] = []; }
        this.xdictionarymap[dictkey].push(exactlocation);
    }
    transform(data, configlocation, datalocation, xtypeheaders){
        let directDataPath = configlocation.map( (element) => { return element.property; });
        if(this.SearchConfigParameter(configlocation, this.config, "condense")){
            if(data.data){ return data.data; }
            if(data.items){ return data.items; }
        }
        if(xtypeheaders["x-mapped-definition"]){
            let shouldbemapped = this.SearchConfigParameter(configlocation, this.config, "x-mapped-definition");
            if(shouldbemapped)
                data = getXMapped(data, xtypeheaders["x-mapped-definition"], this.definition);
        }
        if(xtypeheaders["x-enum-reference"]){
            // Do reverse search here too. This will also be true/false, true returns identifier, false returns numericValue. default to false
            let shouldbemapped = this.SearchConfigParameter(configlocation, this.config, "x-enum-values");
            //console.log("Found x-enum: "+shouldbemapped);
            data = getXEnumReferences(data, xtypeheaders["x-enum-reference"], shouldbemapped);
        }
        //This one doesn't use SearchConfigParameter because we only want to look for transform in this config
        let customoptions = jsonguide.traverseObject(directDataPath, this.config);
        //if(customoptions){ data = formatter(data, customoptions); }
        return data;
    }
    updateLocation(keylist, schema, configlocation, xtypeheaders, addNewProperty){
        let nextlocation = [...configlocation];
        let [nextschema, refkeys] = jsonguide.findSchema(keylist, schema);
        if(refkeys)
            refkeys = refkeys.pop();
        if(addNewProperty){ nextlocation.push({ property: addNewProperty }); }
        let location = nextlocation[ nextlocation.length - 1 ];
        if(xtypeheaders["x-mapped-definition"]){ location.dependency = xtypeheaders["x-mapped-definition"]; }
        if(refkeys){ location.ref = refkeys; }
        return [ nextschema, nextlocation , refkeys];
    }
    ProcessJSONLevel(data, schema, configlocation, datalocation){
        let xtypeheaders = getXTypeHeaders(schema);
        switch(schema.type){
            case "object":
                if(schema.properties){
                    let result = {};
                    Object.keys(data).forEach( (property) => {
                        let [ nextschema, nextlocation, refkeys ] = this.updateLocation(["properties", property], schema, configlocation, xtypeheaders, property);
                        if(!refkeys && !nextschema)
                            result[property] = data[property]; //item doesn't exist in openapi documentation, so just return as-is
                        else
                            result[property] = this.ProcessJSONLevel(data[property], nextschema, nextlocation, [...datalocation, property]);
                    });
                    return this.transform(result, configlocation, datalocation, xtypeheaders);
                }
                else if(schema.additionalProperties){
                    let [ nextschema, nextlocation, refkeys ] = this.updateLocation(["additionalProperties"], schema, configlocation, xtypeheaders, false);
                    let result = {};
                    Object.keys(data).forEach( (property) => {
                        result[property] = this.ProcessJSONLevel(data[property], nextschema, nextlocation, [...datalocation, property]);
                    });
                    return this.transform(result, configlocation, datalocation, xtypeheaders);
                }
                else if(schema.allOf){
                    let [ nextschema, nextlocation, refkeys ] = this.updateLocation(["allOf", 0], schema, configlocation, xtypeheaders, false);
                    let result = this.ProcessJSONLevel(data, nextschema, nextlocation, datalocation);
                    return this.transform(result, configlocation, datalocation, xtypeheaders);
                }
                else
                    throw Error("This object has no properties, God help us all.");
            case "array": {
                let [ nextschema, nextlocation, refkeys ] = this.updateLocation(["items"], schema, configlocation, xtypeheaders, false);
                let result = data.map( (current, index) => {
                    return this.ProcessJSONLevel(current, nextschema, nextlocation, [...datalocation, index]);
                });
                return this.transform(result, configlocation, datalocation, xtypeheaders);
            }
            default:
                let result = data;
                return this.transform(result, configlocation, datalocation, xtypeheaders);
        }
    }
}
const definitions = require("./manifest/en/manifest.json");
const data = require("../env-files/profileData.json");
let config_object = {
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