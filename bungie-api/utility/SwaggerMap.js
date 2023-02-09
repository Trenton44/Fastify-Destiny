import JSONMap from "./JSONMap.js";

export default class SwaggerMap extends JSONMap {
    
    constructor(obj){
        super(obj);
        this.keywords = {
            properties: this.#properties,
            allOf: this.#allOf,
            additionalProperties: this.#additionalProperties,
            items: this.#items,
            "$ref": this.#parseRef
        };
        this.keywordlist = Object.keys(this.keywords);
    }
    flatten(initialRef){
        let temp = {};
        let initialDataRegex = "#";
        let schema = this.obj.components.schemas[initialRef];
        if(!schema)
            throw Error("Could not find schema for given initialRef "+initialRef);
        let gen = this.generate([initialRef], initialDataRegex, schema);
        let next = gen.next();
        while(!next.done){
            temp[next.value[0]] = next.value[1];
            next = gen.next();
        }
        return temp;
    }
    *generate(refUri, dataRegex, data){
        refUri = refUri.slice(0);
        for(let key in data){
            if(!this.keywords[key])
                continue;
            let func = this.keywords[key].bind(this); //bind to maintain "this" reference to instance, seems to break when calling generator as this.keywords[key]
            yield* func(refUri, dataRegex, data[key]);
        }
        yield [dataRegex, {
            ref: refUri, 
            data: Object.fromEntries(Object.entries(data).filter(([key, value]) => !this.keywordlist.find(keyword => keyword == key))) 
        }];
    }
    *#properties(refUri, dataRegex, data){
        for(let key in data){
            let temp = refUri.slice(0);
            temp[0] = temp[0]+"/"+key;
            yield* this.generate(temp, dataRegex+"\\/"+key, data[key]);
        }
    }
    *#additionalProperties(refUri, dataRegex, data){
        if(!data)
            return null
        yield* this.generate(refUri, dataRegex+"\\/[^\\/]*", data);
    }
    *#items(refUri, dataRegex, data){
        refUri.push(null);
        yield* this.generate(refUri, dataRegex+"\\/[^\\/]*", data);
    }
    #resolveRef(ref){
        ref = ref.slice(0);
        if(ref[0] !== "#")
            throw Error("Non-local URL "+ref+" currently unsupported.");
        let path = ref.split("/");
        path.shift();
        let obj = this.locate(path, this.obj);
        let val = obj["$ref"] ? this.resolveRef(obj["$ref"]) : obj;
        return val;
    }
    *#allOf(refUri, dataRegex, data){
        if(!data)
            return null;
        for(let key in data)
            yield* this.generate(refUri, dataRegex, data[key]);
    }
    *#parseRef(refUri, dataRegex, data){
        let temp = data.split("/");
        temp = temp.slice(3, temp.length);
        temp = temp.join("/");
        refUri.push(temp);
        data = this.#resolveRef(data);
        yield* this.generate(refUri, dataRegex, data);
    }
}