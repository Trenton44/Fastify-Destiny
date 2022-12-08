const keywords = ["splice", "group", "filter", "link", "x-enum-reference", "x-mapped-definition"];
const inheritables = ["x-enum-reference", "x-mapped-definition"];

const inheritValues = (data, inherited) => {
    Object.entries(inherited).forEach(([key, value]) => {
        if(!data[key] && inheritables.find( element => element == key))
            data[key] = value;
    });
    return data;
};
export default function* genFlatConfig(uri, data){
    // maybe have it import a list of "keywords" from the relevant schema, and use those instead of custom keywords
    for(let key in data){
        if(keywords.find(element => element == key)){
            yield [uri+'/'+key, data[key]];
            continue;
        }
        data[key] = inheritValues(data[key], data); //level above (data) has values to inherit. check for them and update this data obj.
        yield* genFlatConfig(uri+'/'+key, data[key]);
    }
};

//returns obj keyed by every part of the uri that needs to be altered.
export function* genConfigKeys(uri, data){
    // maybe have it import a list of "keywords" from the relevant schema, and use those instead of custom keywords
    for(let key in data){
        if(keywords.find(element => element == key))
            continue;
        data[key] = inheritValues(data[key], data);
        yield [uri+'/'+key, data[key]];
        yield* genConfigKeys(uri+'/'+key, data[key]);
    }
    return null;
};
/*
    parse all the way down, but at the last level, check if any non-keywords exist. 
    if not, we've reached the bottom of the schema keywords, we yield that.
*/