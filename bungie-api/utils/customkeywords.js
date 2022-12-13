const keywords = {
    //"x-mapped-definition": XMappedDefintition,
    "x-enum-reference": XEnumReference,
    "filter": Filter,
    "group": Group,
    //"link": Link
};

function Filter(data, flatschema, schema, datakey, searchkey, option, level){
    let datakeylist = datakey.split("/");
    datakeylist.shift(); //remove #
    if(!option.find(filterkey => filterkey === datakeylist[level])){
        delete data[datakey];
        return true;
    }
    return false;
}
function Group(data, flatschema, schema, datakey, searchkey, option, level){
    let datakeylist = datakey.split("/");
    datakeylist.shift();
    for(let group in option){
        if(!option[group].find(gkey => gkey === datakeylist[level]))
            return false;
        datakeylist[level] = group+"/"+datakeylist[level];
        datakeylist = "#/"+datakeylist.join("/");
        data[datakeylist] = data[datakey];
        delete data[datakey];
        return true;
    }
    return false;
}
function XEnumReference(data, flatschema, schema, datakey, searchkey, option){
    let enumSchema = flatschema[searchkey].data["x-enum-reference"];
    if(!enumSchema)
        return false;
    if(!option)
        return false;
    enumSchema = enumSchema["$ref"].split("/");
    enumSchema.shift();
    try{ enumSchema = schema.locate(enumSchema); }
    catch{ return false; }
    enumSchema = enumSchema["x-enum-values"];
    let value = enumSchema.find(element => element.numericValue == data[datakey]);
    //Sometimes the D2 api is missing data, like the numericValue and it's corresponding identifier. 
    // in these scenarios, all i can do is return the original value.
    if(!value)
        return true;
    data[datakey] = value.identifier;
    return true;
}
/*
function test(data, schema, datakey, dataregex, option, additionalProperties){
    //x-mapped:
    if(!schema["x-mapped-definition"] && !option)
        return data;
    let newkey = datakey+"Mapped";
    let manifest = getManifest(language);
    let datalocation = this.locate(schema["x-mapped-defintion"]["$ref"], manifest);
    data[newkey] = datalocation;
    //return data;


    //filter
    let dkey = datakey.slice(datakey.findLastIndex("/"), datakey.length - 1);
    if(!option.find(filkey => filkey === dkey))
        delete data[datakey];
    return data;
}*/
export default keywords;