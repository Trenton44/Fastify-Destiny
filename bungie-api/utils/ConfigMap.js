import JSONMap from "./JsonMap.js";

export default class ConfigMap extends JSONMap {
    keywords = ["splice", "group", "filter", "link", "x-enum-reference", "x-mapped-definition"];
    inheritables = ["splice", "x-enum-reference", "x-mapped-definition"];
    transform = {};
    constructor(obj){
        super(obj);
    }
    flatten(){
        let temp = {};
        let gen = this.generate("#", this.obj);
        let next = gen.next();
        while(!next.done){
            temp[next.value[0]] = next.value[1];
            next = gen.next();
        }
        return temp;
    }
    inheritValues(data, inherited) {
        Object.entries(inherited).forEach(([key, value]) => {
            if(!data[key] && this.inheritables.find( element => element == key))
                data[key] = value;
        });
        return data;
    };
    *generate(uri, data){
        for(let key in data){
            // if it's a custom keyword, skip it, no need to do processing.
            if(this.keywords.find(keyword => keyword == key))
                continue;
            data[key] = this.inheritValues(data[key], data);
            yield* this.generate(uri+'/'+key, data[key]);
        }
        yield [uri, Object.fromEntries(Object.entries(data).filter(([key, value]) => this.keywords.find(keyword => keyword == key)))];
    }
    buildOptions(schemaUri){
        let keys = schemaUri.split("/");
        keys.shift();
        let temp = this.obj;
        let opts = Object.fromEntries(Object.entries(temp).filter(([key, value]) => this.keywords.find(keyword => keyword == key)));
        for(let key of keys){
            if(!temp[key])
                return opts;
            opts = this.inheritValues(temp[key], opts);
            temp = temp[key];
        }
    }
    addTransformation(key, func){ this.transform[key] = func; }
}