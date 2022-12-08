/*
    propertylist: Nothing resets, properties all the way down the json tree.
    reflist: resets on every ref resolution, include the ref url and properties afterwards
    yield [reflist, {
        uri: propertylist,
        data: { data obj }
    }]

    TODO: rework this to work like config-generator, where 
*/
const keywords = {
    properties: properties,
    allOf: allOf,
    additionalProperties: additionalProperties,
    items: items
};

export default function* genFlatSchema(uri, refuri, obj, schema) {
    for(let key in obj){
        if(keywords[key]){
            yield* keywords[key](uri, refuri, obj[key], schema);
        }
        else if(key == "$ref"){
            refuri = obj[key];
            yield* genFlatSchema(uri, refuri, resolveRef(obj[key], schema), schema);
        }
        /*else{
            yield [refuri+'/'+key, { dataUri: uri+'/'+key, data: obj[key] }];
        }*/
    }
    yield [refuri, { dataUri: uri, data: obj }];
}
function* properties(uri, refuri, data, schema){
    for(let key in data){
        if(data[key] instanceof Object)
            yield* genFlatSchema(uri+'/'+key, refuri+'/'+key, data[key], schema);
        else
            yield [refuri+'/'+key, { dataUri: uri+'/'+key, data: obj[key] }];
    }
    return null;
}
function* allOf(uri, refuri, data, schema){
    if(!allOf)
        return null;
    for(let key in data)
        yield* genFlatSchema(uri, refuri, data[key], schema);
}
function* additionalProperties(uri, refuri, data, schema){
    if(!data){ return null };
    for(let key in data){
        let temp = {};
        temp[key] = data[key];
        yield* genFlatSchema(uri+'/[^/ ]*', refuri, temp, schema);
    }
}
function* items(uri, refuri, data, schema){
    for(let key in data){
        let temp = {};
        temp[key] = data[key];
        yield* genFlatSchema(uri, refuri, temp, schema)
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

