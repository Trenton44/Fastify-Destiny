export default class JSONMap {
    constructor(obj){
        this.obj = obj;
    }
    locate(keys){
        let temp = this.obj;
        try{ keys.forEach(key => temp = temp[key]); }
        catch{ temp = false; }
        if(!temp)
            throw Error("Unable to find object in json tree.");
        return temp;
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
    inflate(flatData){
        let result = {};
        Object.entries(flatData).forEach(([key, value]) => {
            let keys = key.split("/");
            keys.shift();
            let temp = result;
            for(let i in keys){
                if(!temp[keys[i]])
                    { temp[keys[i]] = {}; }
                if(i == keys.length - 1)
                    { temp[keys[i]] = value; }
                else
                    { temp = temp[keys[i]]; }
            }
        });
        return result;
    }
    *generate(uri, data){
        for(let key in data){
            let temp = [uri+"/"+key, data[key]];
            if(data[key] instanceof Object)
                yield* this.generate(...temp);
            else { yield temp; }
        }
        return null;
    }
}
