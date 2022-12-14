import api_doc from "../data/openapi.json" assert { type: "json" };

function tryTraversal(keylist, obj){
    if(!(obj instanceof Object))
        throw("An object to traverse is required.");
    if(!(keylist instanceof Array))
        throw("Keys to search through the object must in an array");
    try{ keylist.forEach( (key) => obj = obj[key]); }
    catch{ return false; }
    return obj !== undefined ? obj : false;
}

function parseRef(reflink, delim){
    delim = !delim ? "/" : delim;
    let refkeys = reflink.split(delim);
    return refkeys[0] === "#" ? refkeys.slice(1) : refkeys;
}

function findSchema(refkeys, schema=api_doc){
    let obj = tryTraversal(refkeys, schema);
    if(!obj)
        return [ false, false ];
    return !obj["$ref"] ? [ obj, false ] : [ obj, obj["$ref"] ];
}

function findPath(oalink, reqtype, code=200, repformat="application/json"){
    if(!oalink || !reqtype)
        throw Error("findPath() requires an open api path key & the request type.");
    if(!tryTraversal(["paths", oalink], api_doc))
        throw Error("Invalid key "+oalink+" could not be found in openapi.json");
    let keys = [ "paths", oalink, reqtype, "responses", code ];
    let schema = findSchema(keys)[0];
    if(!schema){ throw Error("Unable to find schema for the given request path."); }
    keys = [ "content", repformat, "schema", "properties", "Response"];
    schema = findSchema(keys, schema);
    return schema;
}

export { findPath, findSchema, parseRef, tryTraversal };