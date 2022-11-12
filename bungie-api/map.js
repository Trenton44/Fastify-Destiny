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
            // rework everything after this point to use node's parent ref
            // search recursively up/down the node tree for desired value
            // mixes concerns a bit, but much faster than current version
        });
        return options;
    }
    map(data, schemaarr){
        let refkeys = [ schemaarr[1].pop() ];
        schema = schemaarr[0];
        let nodes = new NodeController(this.config);
        let options = this.#buildCustomOptions(refkeys);

    }
}