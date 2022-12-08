export default function* genFlatJSON(uri, data){
    for(let key in data){
        let temp = [uri+"/"+key, data[key]];
        if(data[key] instanceof Object)
            yield* genFlatJSON(...temp);
        else { yield temp; }
    }
    return null;
}