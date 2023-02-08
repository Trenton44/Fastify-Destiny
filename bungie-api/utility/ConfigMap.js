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
    findInhertiables(data){
        return Object.fromEntries(Object.entries(data).filter(([key, value]) => this.inheritables.find(keyword => keyword == key)));
    }
    findUninheritables(data){
        return Object.fromEntries(Object.entries(data).filter(([key, value]) => this.inheritables.find(keyword => keyword != key) && this.keywords.find(keyword => keyword == key)));
    }
    findKeywords(data){
        return Object.fromEntries(Object.entries(data).filter(([key, value]) => this.keywords.find(keyword => keyword == key)));
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
            //data[key] = this.inheritValues(data[key], data);
            yield* this.generate(uri+'/'+key, data[key]);
        }
        yield [uri, Object.fromEntries(Object.entries(data).filter(([key, value]) => this.keywords.find(keyword => keyword == key)))];
    }
    buildOptions(schemaUri){}
    addTransformation(key, func){
        func.bind(this);
        this.transform[key] = func; 
    }
}