/*
    Config => schema => data => is affected by config

    build local URI's #,//,etc.. out of json keys
    reduce json tree to one level.
    Associate config uri to schema uri, and schema-data uri to data uri.
    schema and schema-data are returned from same generator func.
    after all this, create a node. (May be able to forego it entirely for string-matching and insertion into url path.)

    on schema-data: 
    -basically, if the keyword is properties, append the property to the uri.
        -currently adiding property in addProperties too, but that should change with the new impolementation
        -Arrays get the existing uri, without new props added so have to consider that too.
            - that being said, they all match an object oo, which PROPBABLY has a properties, so may not need to consider this.

    for schema gen:
    all non-basic keywords point back to main flatSchemaGenerator
    basic types yield the key-datakey keval pair for that type.
*/

import API from "../data/openapi.json" assert { type: "json" };
import flattenJSON from "./flatten-json.js";
import genJSON from "./json-generator.js";
import genSchema from "./open-api-generator.js";

const flatAPI = flattenJSON(genSchema, API.components.schemas, API);

export default class DataMap {
    constructor(language){
        this.language = language;
    }
    static async getPath(key, type="get", code=200, format="application/json"){
        if(!key)
            return API.paths;
        return await locate([key, type, code, format], API.paths).catch(error => null);
    }
    static async getSchemas(key){
        if(!key)
            return API.components.schemas;
        return await locate([key], API.components.schemas).catch(error => null);
    }
    static getHeaders(key){
        return !key ? API.components.headers : API.components.headers[key];
    }
    mapResponse(data, link, pathopts, config){
        // searches paths for link, then begins processing 
        if(!config || config == {})
            return data;
        let path = this.getPath(link, pathopts.type, pathopts.code, pathopts.format);
        if(!path)
            return data;
        this.mapData(data, path, config);
    }
    mapData(data, config){
        // assumes calling schema is correct schema for data, and goes straight to processing
        if(!config || config == {})
            return data;
        let schema = this.getSchemas(schemakeys);
        //let nodes = new NodeController(this.config);
        this.Process(data, schema);
    }
    Process(data, config){
        let dataMap = flattenJSON(genJSON, data);
        let configMap = flattenJSON(genJSON, config);
        
    }
    
}