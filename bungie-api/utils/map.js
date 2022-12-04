import { tryTraversal, findSchema } from "./json-traverse.js";
import NodeController from "./nodecontroller.js";
import Node from "./node.js";
import TransformFactory from "./transform-factory.js";
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let API = require("../manifests/openapi.json");

export default class DataMap {
    constructor(language){
        this.language = language;
    }
    static getPath(key){
        return !key ? API.paths : API.paths[key];
    }
    static getSchemas(key){
        return !key ? API.components.schemas : API.components.schemas[key];
    }
    static getHeaders(key){
        return !key ? API.components.headers : API.components.headers[key];
    }
    mapResponse(data, link){
        // searches paths for link, then begins processing
    }
    mapData(data, schema){
        // assumes calling schema is correct schema for data, and goes straight to processing
    }
    
}

async function locate(keys, obj){
    keys.forEach( (key) => obj = obj[key]);
    return obj !== undefined ? obj : Promise.reject("Location not found.");
};

function parseRef(ref, delim="/"){
    let keys = ref.split(delim);
    if(keys[0] === "#")
        keys.shift();
    return keys;
}

async function resolveRef(ref){

}