const keywords = {
    //"x-mapped-definition": XMappedDefintition,
    //"x-enum-reference": XEnumReference,
    "filter": Filter,
    "group": Group,
    //"link": Link
};

function Filter(data, schema, datakey, searchkey, option){
    let dkey = datakey.split("/").pop();
    if(!option.find(filterkey => filterkey === dkey))
        delete data[datakey];
    return data;
}
function Group(data, schema, datakey, searchkey, option){
    for(let group in option){
        for(let key in option[group]){
            //let datakey.find(elem => key === elem);
        }
    }
    return data;
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