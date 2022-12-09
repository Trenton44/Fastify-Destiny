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
    items: items,
    "$ref": parseRef
};
const keywordlist = Object.keys(keywords);
export default function* generatorSchema(refUri, dataRegex, data, schema){
    for(let key in data){
        if(!keywords[key])
            continue;
        yield* keywords[key](refUri, dataRegex, data[key], schema);
    }
    yield [dataRegex, { 
        ref: refUri, 
        data: Object.fromEntries(Object.entries(data).filter(([key, value]) => !keywordlist.find(keyword => keyword == key))) 
    }];
}

function* parseRef(refUri, dataRegex, data, schema){
    refUri = data;
    data = resolveRef(data, schema);
    yield* generatorSchema(refUri, dataRegex, data, schema);
}
function resolveRef(ref, schema){
    ref = ref.slice(0);
    if(ref[0] !== "#")
        throw Error("Non-local URL "+ref+" currently unsupported.");
    let path = ref.split("/");
    path.shift();
    let obj = locate(path, schema);
    let val = obj["$ref"] ? resolveRef(obj["$ref"]) : obj;
    return val;
}
function locate(keys, obj){
    try{ keys.forEach( (key) => obj = obj[key]); }
    catch{ obj = false; }
    if(!obj)
        throw Error("$ref not found in schema.");
    return obj;
}

function* properties(refUri, dataRegex, data, schema){
    for(let key in data){
        yield* generatorSchema(refUri+'/'+key, dataRegex+"\\/"+key, data[key], schema);
    }
}
function* allOf(refUri, dataRegex, data, schema){
    if(!allOf)
        return null;
    for(let key in data)
        yield* generatorSchema(refUri, dataRegex, data[key], schema);
}
function* additionalProperties(refUri, dataRegex, data, schema){
    if(!data)
        return null
    yield* generatorSchema(refUri, dataRegex+"\\/[^\\/]*", data, schema);
}
function* items(refUri, dataRegex, data, schema){
    yield* generatorSchema(refUri, dataRegex+"\\/[^\\/]*", data, schema);
}