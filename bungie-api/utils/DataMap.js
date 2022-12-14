
import JSONMap from "./JsonMap.js";
import ConfigMap from "./ConfigMap.js";
import SwaggerMap from "./SwaggerMap.js";
import keywords from "./customkeywords.js";

import API from "../data/openapi.json" assert { type: "json" };
const BungieAPI = new SwaggerMap(API);

export default class DataMap {
    constructor(data, config, initialRef){
        if(!data || !config)
            throw Error("Missing parameter in DataMap constructor.");
        this.Data = new JSONMap(data);
        this.dataFlat = this.Data.flatten();
        this.BungieAPIFlat = BungieAPI.flatten("Destiny.Responses.DestinyProfileResponse");
        this.Config = new ConfigMap(config);
        this.Config.addTransformation("filter", keywords.filter);
        this.Config.addTransformation("group", keywords.group);
        this.Config.addTransformation("x-enum-reference", keywords["x-enum-reference"]);
    }
    map(){
        const datakeys = Object.keys(this.dataFlat).toString();
        let flatOutput = {};
        for(let schemakey in this.BungieAPIFlat){
            let gen = datakeys.matchAll(schemakey+"(?=,)");
            let next = gen.next();
            if(next.done)
                continue;
            // convert the base ref into array of keys
            let baseref = this.BungieAPIFlat[schemakey].ref[0].split("/");
            //copy list of ref's 
            let refUri = this.BungieAPIFlat[schemakey].ref.slice(0);
            //split first ref into schemakey array
            refUri[0] = refUri[0].split("/")[0];
            // reverse to process the last ref first, i.e. the ref for the leaf node of the json data.
            refUri = refUri.reverse();
            while(!next.done){
                let temp = next.value[0]; //current key of the flatmapped data that we want to process.
                let processed = []; // reset list of one-time config keywords that has been processed on this data
                for(let index in refUri){
                    // if temp return null from a config keyword (the data was deleted) break out and move to the next dataset
                    if(!temp)
                        break;
                    let options = {};
                    try { 
                        // search the config for first ref in the refUri list (the base ref of the API response)
                        // if config data is found, this should override whatever refs exist elsewhere in the config.
                        options = this.Config.locate(baseref.slice(0, refUri.length - index)); 
                    }
                    catch{
                        try {
                            // if no direct config exists, look for a config using the data's schema $ref.
                            options = this.Config.locate(refUri.slice(index, index+1));
                        }
                        // if no config, nothing to be done, move to the next in the list.
                        catch{ continue; }
                    }
                    // if here, a config has been found at this level, now we run each of it's keywords
                    for(let optkey in options){
                        // no function for this keyword, nothing to do
                        if(!this.Config.transform[optkey])
                            continue;
                        // if key is inheritable, make sure we haven't already called it
                        if(this.Config.inheritables.find(inheritable => inheritable === optkey)){
                            if(processed.find(pkey => pkey === optkey))
                                continue;
                            processed.push(optkey); // if it hasn't already been called, mark it as called.
                        }
                        // custom functions should return the data's key.
                        // if altered, the new key for accesing the data should be returned.
                        // if deleted, null should be returned
                        temp = this.Config.transform[optkey](this.dataFlat, this.BungieAPIFlat, BungieAPI, temp, schemakey, options[optkey], refUri.length-1-index);
                        // if data is deleted, break out of this loop.
                        if(!temp){ break; }
                    }
                }
                flatOutput[temp] = this.dataFlat[temp];
                delete this.dataFlat[temp];
                next = gen.next();
            }
        }
        return [this.Data.inflate(flatOutput), this.Data.inflate(this.dataFlat)];
    }
}