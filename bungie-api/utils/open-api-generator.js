
const keywords = {
    properties: properties,
    allOf: allOf,
    additionalProperties: additionalProperties,
    items: items
};

export default function* genFlatSchema(uri, obj, schema) {
    for(let key in obj){
        if(keywords[key])
            yield* keywords[key](uri, obj[key], schema);
        else if(key == "$ref")
            yield* genFlatSchema(uri, resolveRef(obj[key], schema), schema);
        else
            yield [uri+'/'+key, obj[key]];
    }
    return null;
}
function* properties(uri, data, schema){
    for(let key in data){
        if(data[key] instanceof Object)
            yield* genFlatSchema(uri+'/'+key, data[key], schema);
        else
            yield [uri+'/'+key, obj[key]];
    }
    return null;
}
function* allOf(uri, data, schema){
    if(!allOf)
        return null;
    for(let key in data)
        yield* genFlatSchema(uri, data[key], schema);
}
function* additionalProperties(uri, data, schema){
    if(!data){ return null };
    for(let key in data){
        let temp = {};
        temp[key] = data[key];
        yield* genFlatSchema(uri, temp, schema);
    }
}
function* items(uri, data, schema){
    for(let key in data){
        let temp = {};
        temp[key] = data[key];
        yield* genFlatSchema(uri, temp, schema)
    }
        
}
function resolveRef(ref, schema){
    ref = ref.slice(0);
    if(ref[0] === "#"){
        let path = ref.split("/");
        path.shift();
        let obj = locate(path, schema);
        let val = obj["$ref"] ? resolveRef(obj["$ref"]) : obj;
        return val;
    }
    else{ throw Error("Non-local URL "+ref+" currently unsupported."); }
}
function locate(keys, obj){
    try{ keys.forEach( (key) => obj = obj[key]); }
    catch{ obj = false; }
    if(!obj)
        throw Error("$ref not found in schema.");
    return obj;
}

