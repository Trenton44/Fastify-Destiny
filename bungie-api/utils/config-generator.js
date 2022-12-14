const keywords = ["splice", "group", "filter", "link", "x-enum-reference", "x-mapped-definition"];
const inheritables = ["splice", "x-enum-reference", "x-mapped-definition"];

const inheritValues = (data, inherited) => {
    Object.entries(inherited).forEach(([key, value]) => {
        if(!data[key] && inheritables.find( element => element == key))
            data[key] = value;
    });
    return data;
};
 /**
  * Generator function that flattens JSON Config object to a single level, with values containing relevant keyword data for processing.
  * yields one sublevel at a time, starting from leaf nodes and working upwards.
  * @param {String} uri - string showing original location within JSON
  * @param {Obj} data - JSON obj
  */
export default function* generatorConfig(uri, data){
    for(let key in data){
        // if it's a custom keyword, skip it, no need to do processing.
        if(keywords.find(keyword => keyword == key))
            continue;
        data[key] = inheritValues(data[key], data);
        yield* generatorConfig(uri+'/'+key, data[key]);
    }
    yield [uri, Object.fromEntries(Object.entries(data).filter(([key, value]) => keywords.find(keyword => keyword == key)))];
}

/*export default function* genFlatConfig(uri, data){
    // maybe have it import a list of "keywords" from the relevant schema, and use those instead of custom keywords
    for(let key in data){
        if(keywords.find(element => element == key)){
            yield [uri+'/'+key, data[key]];
            continue;
        }
        data[key] = inheritValues(data[key], data); //level above (data) has values to inherit. check for them and update this data obj.
        yield* genFlatConfig(uri+'/'+key, data[key]);
    }
};*/