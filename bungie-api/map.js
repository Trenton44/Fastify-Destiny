const guide = require("./json-schema-controller.js");
const NodeController = require("./nodecontroller.js");
const Node = require("./node.js");
const TransformFactory = require("../transform-factory.js");


class DataMap {
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
        this.Process(data, schema, refkeys, nodes.root);
        return nodes.compileTree();
    }
    Process(data, schema, ckeys, node){
        switch(schema.type){
            case "object": {
                if(schema.properties){
                    Object.keys(data).forEach( (property) => {
                        let [ nodeschema, schemaref ] = guide.findSchema(["properties"], schema);
                        if(!schemaref && !nodeschema){
                            let nextnode = new Node(property)
                        }
                    });
                }
            }
        }

    }
}

module.exports = DataMap;