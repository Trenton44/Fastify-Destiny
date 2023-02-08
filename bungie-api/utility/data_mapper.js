import JSONMap from "./JSONMap.js";
import ConfigMap from "./ConfigMap.js";
import SwaggerMap from "./SwaggerMap.js";
import keywords from "./keyword_functions.js";

import API from "../data/openapi.json" assert { type: "json" };
const BungieAPI = new SwaggerMap(API);

export default class DataMapper {
    constructor(data, iRef, config={}){
        if(!data || !config || !iRef)
            throw Error("Missing parameter in DataMap constructor.");
        this.data = new JSONMap(data);
        //flatmap the data to be processed
        this.fdata = this.data.flatten();
        //flatmap the bungie API schema data for the desired endpoint.
        this.fbdata = BungieAPI.flatten(iRef);

        //flatmap and add keywords transforms for config data
        this.config = new ConfigMap(config);
        this.config.addTransformation("filter", keywords.filter);
        this.config.addTransformation("group", keywords.group);
        this.config.addTransformation("x-enum-reference", keywords["x-enum-reference"]);
    }
    async map(){
        if(this.config == {})
            return this.data.obj;
        const datakeys = Object.keys(this.fdata).toString();
        let foutput = {};
        for(let schemakey in this.fbdata){
            let generator = datakeys.matchAll(schemakey+"(?=,)");
            let next = generator.next();
            if(next.done){ continue; }
            
            //convert the base reference into key array
            let baseref = this.fbdata[schemakey].ref[0].split("/");

            // copy the list of references
            let refUri = this.fbdata[schemakey].ref.slice(0);
            // split the first reference into array of schema keys
            refUri[0] = refUri[0].split("/")[0];
            // reverse to process the last ref first, i.e. the ref for the leaf node of the json data.
            refUri = refUri.reverse();
            while(!next.done){
                let temp = next.value[0]; //current key of the flatmapped data that we want to process.
                let processed = []; // reset list of one-time config keywords that has been processed on this data
                for(let index in refUri){
                    // if temp return null from a config keyword (the data was deleted) break out and move to the next dataset
                    if(!temp){ break; }
                    let options = {};
                    try{
                        // search the config for first ref in the refUri list (the base ref of the API response)
                        // if config data is found, this should override whatever refs exist elsewhere in the config.
                        options = this.config.locate(baseref.slice(0, refUri.length - index)); 
                    }
                    catch{
                        try {
                            // if no direct config exists, look for a config using the data's schema $ref.
                            options = this.config.locate(refUri.slice(index, index+1));
                        }
                        // if no config, nothing to be done, move to the next in the list.
                        catch{ continue; }
                    }
                    // if here, a config has been found at this level, now we run each of it's keywords
                    for(let optkey in options){
                        // no function for this keyword, nothing to do
                        if(!this.config.transform[optkey])
                            continue;
                        // if key is inheritable, make sure we haven't already called it
                        if(this.config.inheritables.find(inheritable => inheritable === optkey)){
                            if(processed.find(pkey => pkey === optkey))
                                continue;
                            processed.push(optkey); // if it hasn't already been called, mark it as called.
                        }
                        // custom functions should return the data's key.
                        // if altered, the new key for accesing the data should be returned.
                        // if deleted, null should be returned
                        temp = this.config.transform[optkey](this.fdata, this.fbdata, BungieAPI, temp, schemakey, options[optkey], refUri.length-1-index);
                        // if data is deleted, break out of this loop.
                        if(!temp){ break; }
                    }
                }
                foutput[temp] = this.dataFlat[temp];
                delete this.dataFlat[temp];
                next = generator.next();
            }
        }
        return [this.data.inflate(foutput), this.data.inflate(this.fdata)];
    }
}