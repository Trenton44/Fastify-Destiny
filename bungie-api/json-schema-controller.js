const api_doc = require("./openapi.json");

function traverseObject(keylist, obj){
    try{ keylist.forEach( (key) => { obj = obj[key]; }); }
    catch{ return false; }
    if(obj == undefined){ return false; }
    return obj;
}

function parseSchemaRef(reflink, delimiter){
    if(!delimiter) { delimiter = "/"; }  //local schema ref's use /, so defaulting to it.
    let linkarray = reflink.split(delimiter);
    if(linkarray[0] === "#") { return linkarray.slice(1); } //return without leading # if it exists
    return linkarray;
}

function findSchema(keylist, schema){
    //  if no schema is passed, search through the whole api doc.
    if(!schema){ schema = api_doc; }
    // if no object, return false for both
    let obj = traverseObject(keylist, schema);
    if(!obj){ return [false, false]; }

    //check if it the resulting value is a json schema $ref. if not return obj
    let isref = traverseObject(["$ref"], obj);
    if(!isref){ return [obj, false]; }

    //  if it is a schema $ref, parse the ref into a keylist and return the [ obj, keylist ]
    let path = parseSchemaRef(isref);
    obj = traverseObject(path, api_doc);
    return [obj, path];
}

function findPathSchema(openapilink, code=200, requesttype="get", responseformat="application/json"){
    let keys = [ "paths", openapilink, requesttype, "responses", code ];
    let schema = findSchema(keys, api_doc)[0];
    if(!schema){ return Error("Unable to find schema for response parameters")}
    keys = [ "content", responseformat, "schema", "properties", "Response" ];
    schema = findSchema(keys, schema);
    return schema;
}

module.exports = { traverseObject, findPathSchema, parseSchemaRef, findSchema };