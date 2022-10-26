
function FormatFromConfig(data, options){
    if(customoptions["reduce"]){
        data = ReduceObject(data, customoptions["reduce"]);
    }
    if(customoptions["group"]){
        data = GroupObjectToKey(data, customoptions["group"]);
    }
    if(customoptions["filter"]){
        data = FilterByKeyValue(data, customoptions["filter"]);
    }
    if(customoptions["append"]){
        data = AppendToObject(data, customoptions["append"]);
    }
    if(customoptions["combine"]){
        if(customoptions["combine"] == "*")
            data = CombineBySimilarKeys(data, customoptions["combine"]);
        else
            data = Group
    }
    if(customoptions["attach"]){
        data = AttachObjectByKeyValue(data, customoptions["attach"]);
    }
    return data;
}

function ReduceObject(data, filterlist){
    if(!(object instanceof Object)){ return data; }
    if(object instanceof Array){ throw Error("YOU SHOULDN'T BE HERE."); }
    let keys = Object.keys(data);
    for(let key of keys){
        if(!filterlist.includes(key))
            delete data[key];
    }
    return data;
}
function GroupArrayByKey(data, key){
    let temp = {};
    data.forEach( (element) => {
        if(!element[key]){
            if(!temp["unsorted"]){ temp["unsorted"] = []; }
            temp["unsorted"].push(element);
            return;
        }
        if(!temp[element[key]])
            temp[element[key]] = [];
        temp[element[key]].push(element);
    });
    return temp;
}
function GroupObjectToKey(data, options){ 
    //TODO: verify data is actually an object
    let output = {};
    let outputkeys = Object.keys(options);
    for(let i in outputkeys){
        output[outputkeys[i]] = {};
        let datakeys = Object.keys(options[outputkeys[i]]);
        for(let key of datakeys){
            //if the requested key isn't actually in the data, ignore it and move on
            if(!data[key])
                continue;
            output[outputkeys[i]][key] = data[key];
        }
    }
    //remove any new keys that ended up with nothing to put in them.
    for(let key of output)
        if(Object.keys(key).length == 0){ delete output[key]; }
    return output; 
}
function FilterByKeyValue(data, options){ 
    //TODO: verify data is an array
    let key = Object.keys(options)[0];
    let value = options[key];
    for(let item of data){
        if(item[key] != value)
            delete item;
    }
    return data; 
}
function AppendToObject(data, appendlist){
    //TODO: verify input data is an object.
    //appendlist is an array, items in array structured as [key, value] (key the data is to be placed in, data being the data to append.)
    for(let item of appendlist){
        data[item[0]] = item[1];
    }
    return data;
}
function CombineBySimilarKeys(data){ 
    let temp = {};
    let grouped = {};
    for(property in data){
        //if property has no data, just copy the empty key over, to maintain consistency between In/Out
        if(!data[property]){
            grouped[property] = data[property];
            continue;
        }
        Object.keys(data[property]).forEach( (element) => {
            //create a new array, if there isn'to one yet for this property
            if(!temp[element])
                temp[element] = [];
            temp[element].push(property);
        });
    }
    for(property in temp){
        let current = temp[property];
        if(current.length < 1) 
            grouped[current[0]] = data[current[0]]; // pull the first (and only) set of data, return it to the original data
        else {
            //multiple keys have been found, so regroup each object under their original subkey
            grouped[property] = {};
            current.forEach( (element) =>{
                grouped[property][element] = data[element][property];
                delete data[element][property];
            });
        }
    }
    return grouped;
}
function AttachObjectByKeyValue(data, options){ //options should be structured as [[key, value], parent object, child object]
    return data; 
}

 
module.exports = FormatFromConfig;