const keywords = {
    //"x-mapped-definition": XMappedDefintition,
    "x-enum-reference": XEnumReference,
    "filter": Filter,
    "group": Group,
    //"link": Link
};

function Filter(data, schema, datakey, searchkey, option, level){
    let datakeylist = datakey.split("/");
    datakeylist.shift(); //remove #
    if(!option.find(filterkey => filterkey === datakeylist[level])){
        delete data[datakey];
        return true;
    }
    return false;
}
function Group(data, schema, datakey, searchkey, option, level){
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
function XEnumReference(data, schema, datakey, searchkey, option){
    console.log(option);
    let enumSchema = schema[searchkey].data["x-enum-reference"];
    if(!enumSchema)
        return true;
    enumSchema = schema[enumSchema["$ref"]];
    console.log("");
    console.log(enumSchema);
    //let temp = data[datakey];
    
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