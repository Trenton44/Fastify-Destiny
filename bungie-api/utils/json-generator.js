export default function* genFlatJSON(uri, data){
    for(let key in obj){
        let temp = [uri+"/"+key, obj[key]];
        if(obj[key] instanceof Object)
            yield* genFlatJSON(...temp);
        else { yield temp; }
    }
    return null;
}