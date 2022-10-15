const api_doc = require("./openapi.json");

// Helper functions for parsing/interacting with data

//  Traverses through a given object, one key at a time (using an array of keys), to find a key-value. 
//      If the key-value doesn't exist, return false
//      If the key-value is undefined, return false
function traverseObject(keylist, searchObj){
    try{ keylist.forEach( (key) => {  searchObj = searchObj[key];  }); }
    catch { return false; }
    if(!searchObj) { return false; } // if the object is found, but is undefined, also return false.
    return searchObj;
}

//  Takes a config object, and iterates through it using the list of obj keys that our data is stored at.
//  In this config object, a function for transforming the data should be stored in the same location as our data, using the keyword "transform"
//  Ex: if our data is stored at components.schemas.DestinyItemComponent
//  then in the config object, we would have components.schemas.DestinyItemComponent.transform = function(data) { "code to transform the data" }
//  
function transformFromConfig(key_array, data, config){
    key_array = key_array.slice(0); //to make sure it doesn't affected the original keylist. I don't think it will, but can never be sure.
    key_array.push("transform"); //The keyword the function is stored in. Note: This will be a problem if the data has a proprty "transform" already.
    let reference = traverseObject(key_array, config);
    if(!reference) //if no configuration function exists, there's no transformation to be done. return data as-is
        return data;
    return reference(data); //call the transform function, return transformed data.
}

//parses the $ref link into an array of keys that can be used to get to the actual schema inside the api doc object.
//Note: currently all $refs in the api doc obj are local, and have a leading #. if this changes, will need to add logic to accomodate
function parseSchemaRef(ref_link, delimiter){
    if(!delimiter) { delimiter = "/"; }  //local schema ref's use /, so defaulting to it.
    let link_array = ref_link.split(delimiter);
    if(link_array[0] === "#") { return link_array.slice(1); } //return without leading # if it exists
    return link_array;
}

//This function checks for a few specific x-type-headers inside the schema that may indicate the keys inside of our data may be indexed to a value, rather than matching the schema's property key.
//  If they are in the schema, the keys may be indexed, which is good to know
function dataIndexed(schema){
    let relevant_headers = ["x-dictionary-key", "x-mapped-definition"]; //"x-enum-values"
    let schema_keys = Object.keys(schema);
    for(i in schema_keys){
        for(z in relevant_headers){
            if(schema_keys[i] == relevant_headers[z])
                return true;
        }
    }
    return false;
}


//  The entrypoint for every endpoint that has data to process.
//  Iterate through the open api documentation to get, in order:
//      -The $ref schema for the endpoint's Response
//      -The $ref schema for the response's Response object
//  Then pass that schema and array of keys leading to it in the JSON (api doc is in JSON), and begin processing the data.
function processAPIEndpoint(path, request_type, status_code, endpoint_data, config){
    let key_array = ["paths", path, request_type, "responses", status_code, "$ref"];
    let api_path = traverseObject(key_array, api_doc);
    if(!api_path)
        throw Error("API Path could not be discovered.");
    let schema_ref_array = parseSchemaRef(api_path);
    let schema = traverseObject(schema_ref_array, api_doc);

    key_array = ["content", "application/json", "schema","properties", "Response", "$ref"];
    let response_ref = traverseObject(key_array, schema);
    if(!response_ref)
        throw Error("Couldn't discover response ref");
    schema_ref_array = parseSchemaRef(response_ref);
    schema = traverseObject(schema_ref_array, api_doc);
    return propertyProcessController(schema_ref_array, schema, endpoint_data, false, true, config);
}



async function propertyProcessController(key_array, schema, data, indexed, isNewSchema, config){
    if(isNewSchema)
        indexed = dataIndexed(schema);
    switch(schema.type){
        case "object":
            data = processObjectSchema(key_array, schema, data, indexed, config);
            return transformFromConfig(key_array, data, config);
        case "array":
            data = processArraySchema(key_array, schema, data, indexed, config);
            return transformFromConfig(key_array, data, config);
        default:
            data = processBasicSchema(key_array, schema, data, indexed, config);
            return transformFromConfig(key_array, data, config);
    }
}