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
function transformFromConfig(key_array, schema, data, config){
    temp_key_array = key_array.slice(0); //to make sure it doesn't affected the original keylist. I don't think it will, but can never be sure.
    temp_key_array.push("transform"); //The keyword the function is stored in. Note: This will be a problem if the data has a proprty "transform" already.
    let reference = traverseObject(temp_key_array, config);
    if(!reference) //if no configuration function exists, there's no transformation to be done. return data as-is
        return data;
    return reference(data); //call the transform function, return transformed data.
}

//parses the $ref link into an array of keys that can be used to get to the actual schema inside the api doc object.
//Note: currently all $refs in the api doc obj are local, and have a leading #. if this changes, will need to add logic to accomodate
function parseSchemaRef(ref_link, delimiter){
    if(!delimiter) 
        delimiter = "/";  //local schema ref's use /, so defaulting to it.
    let link_array = ref_link.split(delimiter);
    if(link_array[0] === "#") 
        return link_array.slice(1); //return without leading # if it exists
    return link_array;
}

//This function checks for a few specific x-type-headers inside the schema that may indicate the keys inside of our data may be indexed to a value, rather than matching the schema's property key.
//  If they are in the schema, the keys may be indexed, which is good to know
function dataIndexed(key_array, schema, data){
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

function Entrypoint(path, request_type, status_code, data, config){
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
    return propertyProcessController(schema_ref_array, schema, data, false, true, config);
}

//  This is where every new iteration goes through. The general idea is, JSON Schema Objects are just schemas holding other schemas
//  So everytime we go a level deeper into the api documentation, we check for the next schema's type, and route to a function based on that.
//  Furthermore, some of the schemas have an x-type-header that indicates if the corresponding data's keys are indexed.
//  We need to know that, so "indexed" lets us figure that out. However, some schemas, like most arrays, just hold a reference to the actual data's schema.
//  We need to pass the knowledge of being "indexed" along, so in cases where we aren't using a brand new schema (like processing array types or objects with additionalProperties), we pass "isNewSchema" as false, so "indexed" isn't reset.
function propertyProcessController(key_array, schema, data, indexed, isNewSchema, config){
    let stack = [];
    let node = [key_array, schema, data, indexed, isNewSchema];
    stack.push(node);
    for(let i = 0; i < stack.length; i++){
        if(stack[i][1].type != "object" && stack[i][1].type != "array"){ continue; } // it's a basic-type node, it won't have any children to process.
        stack.splice(i+1, 0, ...processByProperty(stack[i]));
    }
    while(stack.length != 0){
        stack[stack.length - 1][2] = transformFromConfig(stack[stack.length - 1][0], stack[stack.length - 1][1], stack[stack.length - 1][2], config);
        temp = stack[stack.length - 1];
        stack.pop();
    }
    return data; // might need to add a transformFromConfig here too.
}
function processByProperty(parameters){
    let key_array = parameters[0];
    let schema = parameters[1];
    let data = parameters[2];
    let indexed = parameters[3];
    let isNewSchema = parameters[4];
    if(isNewSchema)
        parameters[3] = dataIndexed(key_array, schema, data);
    switch(schema.type){
        case "object":
            children = processObjectSchema(parameters);
            break;
        case "array":
            children = processArraySchema(parameters);
            break;
        default:
            children = processBasicSchema(parameters);
            break;
    }
    return children;
}


function processBasicSchema(parameters){ return parameters; }

function processArraySchema(parameters){
    let key_array = parameters[0];
    let schema = parameters[1];
    let data = parameters[2];
    let indexed = parameters[3];

    let itemlist = traverseObject(["items", "$ref"], schema);
    if(itemlist){
        key_array = parseSchemaRef(itemlist);
        schema = traverseObject(key_array, schema);
        isNewSchema = true;
    }
    else{
        schema = schema.items;
        isNewSchema = false;
    }
    let children = [];
    for(i in data){ children.push([key_array, schema, data[i], indexed, isNewSchema]); } // data should now be a list of all the children and their parameters
    //.map creates a new array, which might cause this whole thing to break, since it depends on objects/array passing references
    return children;
}
function processObjectSchema(parameters){
    if(parameters[1].properties)
        return processKeywordProperties(parameters);
    else if(parameters[1].additionalProperties)
        return processKeywordAdditionalProperties(parameters);
    else if(parameters[1].allOf)
        return processKeywordAllOf(parameters);
    else
        throw Error("This object has no properties, God help us all.")
}

function processKeywordProperties(parameters){
    let key_array = parameters[0];
    let schema = parameters[1];
    let data = parameters[2];
    let indexed = parameters[3];

    let children = [];

    for(property in data){
        let passKeys = key_array.slice(0);
        let passSchema = schema.properties;
        let isNewSchema = true;
        if(traverseObject([property, "$ref"], passSchema)){
            //object property has a $ref, set that as the schema and go
            passKeys = parseSchemaRef( traverseObject([property, "$ref"], passSchema) );
            passSchema = traverseObject(passKeys, api_doc); //Note: api_doc is global reference to openapi.json, bungie api documentation
        }
        else{
            //  If we get here, this particular property is either:
            //  1: One holding it's own schema info instead of a $ref to another
            //  2: An indexed property, so the key won't match up to it's corresponding schema key
            //  3: A property that isn't documented by the api docs (unfortunately, it happens)
            if(traverseObject([property], passSchema)){
                // Possibiliy 1, we can pass the data/schema and move on.
                passKeys.push(property);
                passSchema = passSchema[property];
            }
            else{
                
                // If here, it's either possibility 2 or 3.
                if(indexed){
                    // If my code is right up to this point, we should have an indication of if the keys are indexed.
                    //  if they are, We are going to assume that this is the ONLY schema property, as I can't imagine having multiple schemas on indexed data.
                    //  In which case, pass the SCHEMA property in place of the data property, and move on.
                    //  Note: If there ever is a condition where we have multiple indexed schema properties, we're just screwed.
                    passKeys.push(Object.keys(passSchema)[0]);
                    passSchema = schema;
                    isNewSchema = false;

                }
                else {
                    //At this point, it's either indexed, and the api doesn't indicate it, or it's an undocumented property of the data.
                    //  Regardless, there's nothing we can do, so just return the data as-is.
                    console.log("Can't tell if "+property+" is undocumented or indexed.");
                    //parsed_properties[property] = data[property]; //No longer using parsed_properties, so just don't touch the data.
                    continue; 
                    // keeping the continue, because while this property won't appear in the list (the stack in propertyProcessController)
                    // it will still be in the original data, and so, it will still be returned, but without being run through transformFromConfig (which is what we want)
                }
            }
        }
        children.push([passKeys, passSchema, data[property], indexed, isNewSchema]); 
    }
    return children;
}

function processKeywordAdditionalProperties(parameters){
    let key_array = parameters[0];
    let schema = parameters[1];
    let data = parameters[2];
    let indexed = parameters[3];

    let prop_schema = traverseObject(["additionalProperties", "$ref"], schema);
    if(prop_schema){
        key_array = parseSchemaRef(prop_schema);
        schema = traverseObject(key_array, api_doc);
    }
    else{
        // In the case where there isn't a schema ref, we want to pass along the knowledge of if this data is indexed.
        schema = schema.additionalProperties;
    }

    let children = [];
    for(property in data){
        children.push([key_array, schema, data[property], indexed, false]);
    }
    return children;
}

function processKeywordAllOf(parameters){
    let key_array = parameters[0];
    let schema = parameters[1];
    let data = parameters[2];
    let indexed = parameters[3];

    let prop_schema = traverseObject(["allOf", 0, "$ref"], schema);
    if(prop_schema){
        key_array = parseSchemaRef(prop_schema);
        schema = traverseObject(key_array, api_doc);
    }
    else 
        throw Error("First instance of allOf without a $ref, don't currently support this.");
    return [[key_array, schema, data, indexed, false]]; //we pass false to isNewSchema by default, as allOf should only ever reference another schema.
}

let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
let request_type = "get";
let code = "200";
const test_data = require("./profileData.json");
const config_objects = require('./backendTransformations.js');
console.log("Get Profile: ");
console.log(config_objects.GetProfile);
let blah = Entrypoint(api_doc_link, request_type, code, test_data, config_objects.GetProfile);
const fs = require('fs');
fs.writeFile("parsedProfileData.json", JSON.stringify(blah), (result) => console.log("success"));
