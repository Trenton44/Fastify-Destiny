import guide from "./json-schema-controller.js";
import NodeController from "./nodecontroller.js";
import Node from "./node.js";
import TransformFactory from "./transform-factory.js";
import SwaggerParser from "@apidevtools/swagger-parser";
let API = await SwaggerParser.resolve("../manifests/openapi.json");


export default class DataMap {
    constructor(language, config={}){
        this.transformFactory = new TransformFactory(language);
        this.config = config;
    }
    #buildCustomOptions(ckeys, rkeys){
        let config = ckeys instanceof Array ? guide.tryTraversal(ckeys, this.config) : [];
        let ref = rkeys instanceof Array ? guide.tryTraversal([ rkeys[rkeys.length -1] ], this.config) : [];
        let options = {};
        configkeywords.forEach( (key) =>{
            options[key] = ref[key] != undefined ? ref[key] : undefined;
            options[key] = config[key] != undefined ? config[key] : undefined;
        });
        inheritablekeywords.forEach( (key) => {
            if(options[key] != undefined)
                return true;
            let initial = false;
            let ccurrent = this.config;
            for(let key of ckeys){
                let clevel = guide.tryTraversal(key, ccurrent);
                if(!clevel)
                    break;
                if(clevel[key] != undefined)
                    initial = clevel[key];
            }
            options[key] = initial;
        });
        return options;
    }
    map(data, schemaarr){
        let refkeys = [ schemaarr[1].pop() ];
        schema = schemaarr[0];
        let nodes = new NodeController(this.config);
        let options = this.#buildCustomOptions(refkeys);
        let funcs = this.transformFactory.buildTransformArray(options, schema);
        nodes.root = new Node("", options, funcs);
        this.#Process(data, schema, refkeys, nodes.root);
        return nodes.compileTree();
    }
    #Process(data, schema, ckeys, node){
        switch(schema.type){
            case "object": {
                if(schema.properties){
                    Object.keys(data).forEach( (property) => {
                        let [ nodeschema, schemaref ] = guide.findSchema(["properties"], schema);
                        if(!schemaref && !nodeschema){
                            let nextnode = new Node(property);
                            node.addChild(nextnode);
                            nextnode.data = data[property];
                            return true;
                        }
                        let options = this.#buildCustomOptions([ ...ckeys, property ], schemaref);
                        let funcs = this.transformFactory.buildTransformArray(options, nodeschema);
                        let nextnode = new Node(property, options, funcs);
                        this.#Process(data[property], nodeschema, [...ckeys, property], nextnode);
                    });
                }
                else if(schema.additionalProperties){
                    let [ nodeschema, schemaref ] = guide.findSchema(["additionalProperties"], schema);
                    Object.keys(data).forEach( (property) => {
                        let options = this.#buildCustomOptions([...ckeys, property], schemaref);
                        let funcs = this.transformFactory.buildTransformArray(options, nodeschema);
                        let nextnode = new Node(property, options, funcs);
                        node.addChild(nextnode);
                        this.#Process(data[property], nodeschema, [...ckeys, property], nextnode);
                    });
                }
                else if(schema.allOf){
                    let [ nodeschema, schemaref ] = guide.findSchema(["allOf", 0], schema);
                    //  may need to come back and add schemaref/allOf to the config here
                    this.#Process(data, nodeschema, ckeys, node);
                }
                else{ throw Error("This object has no properties, God help us all."); }
                return true;
            }
            case "array": {
                let [ nodeschema, schemaref ] = guide.findSchema(["items"], schema);
                let options = this.#buildCustomOptions(ckeys, schemaref);
                data.forEach( (current, index) => {
                    let funcs = this.transformFactory.buildTransformArray(options, nodeschema);
                    let nextnode = new Node(index, options, funcs);
                    node.addChild(nextnode);
                    this.#Process(current, nodeschema, ckeys, nextnode);
                });
                return true;
            }
            default: {
                node.data = data;
                return true;
            }
        }
    }
};