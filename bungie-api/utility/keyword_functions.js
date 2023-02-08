import manifest from "../data/manifest.js";
import geManifest from "../data/manifest.js";

const keywords = {
    "x-mapped-definition": XMappedDefintition,
    "x-enum-reference": XEnumReference,
    "filter": Filter,
    "group": Group,
    "splice": Splice
    //"link": Link
};
//NOTE: to access a leaf node property, you will need to add +1 to the level, to avoid accessing the object storing the property.

function Filter(data, flatschema, schema, datakey, searchkey, option, level){
    let datakeylist = datakey.split("/");
    datakeylist.shift(); //remove #
    //the key in the datakey uri that will be compared against filter args.
    if(!option.find(filterkey => filterkey === datakeylist[level])){
        delete data[datakey];
        return null;
    }
    return datakey;
}
function Group(data, flatschema, schema, datakey, searchkey, option, level){
    let datakeylist = datakey.split("/");
    datakeylist.shift();
    for(let group in option){
        if(!option[group].find(gkey => gkey === datakeylist[level]))
            continue;
        datakeylist[level] = group+"/"+datakeylist[level];
        datakeylist = "#/"+datakeylist.join("/");
        data[datakeylist] = data[datakey];
        delete data[datakey];
        return datakeylist;
    }
    return datakey;
}
function XEnumReference(data, flatschema, schema, datakey, searchkey, option){
    let enumSchema = flatschema[searchkey].data["x-enum-reference"];
    if(!enumSchema || !option)
        return datakey;
    enumSchema = enumSchema["$ref"].split("/");
    enumSchema.shift();
    try{ enumSchema = schema.locate(enumSchema); }
    catch{ return datakey; }
    let enumvalue = enumSchema["x-enum-values"].find(val => val.numericValue == data[datakey]);
    //Sometimes the D2 api is missing data, like the numericValue and it's corresponding identifier. 
    // in these scenarios, all i can do is return the original value.
    if(!enumvalue)
        return datakey;
    data[datakey] = enumvalue.identifier;
    return datakey;
}
function Link(data, flatschema, schema, datakey, searchkey, option){
    /*
        Link Rules:
        -Must a parent of ALL nodes that are being linked
        
    */
}
function Splice(data, flatschema, schema, datakey, searchkey, option){
    let datakeylist = datakey.split("/");
    option.forEach(okey =>{
        let offendex = datakeylist.findIndex(dkindex => dkindex === okey);
        if(offendex !== -1)
            datakeylist.splice(offendex, 1); 
    });
    return datakeylist.join("/");
}
function XMappedDefintition(data, flatschema, schema, datakey, searchkey, option){
    //get uri $ref from schema value.
    // manifest data should be flatmapped eventually, so uri will correspond to file name containing data
    let manifestUri = flatschema[searchkey].data["x-mapped-definition"];
    if(!manifestkeylist || !option)
        return datakey;
    let manifestData = getManifest(manifestUri);
    if(!manifestData)
        return datakey;
    data[datakey+"Mapped"] = manifestData;
    return datakey;
}
export default keywords;