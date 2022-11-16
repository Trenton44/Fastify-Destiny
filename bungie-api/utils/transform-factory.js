const Node = require("./node.js");
const getManifest = require("./manifest/index.js");
const schemakeywords = [ "x-mapped-definition", "x-enum-reference" ];
const serverkeywords = [ "filter", "group", "link" ];

const transformFunctions = {
    "x-mapped-definition": function(node){
        let xdatanode = new Node(node.key+"Mapped");
        let xmapdata = guide.traverseObject([this.data.keys, node.data], this.data.data);
        xdatanode.data = xmapdata;
        node.parent.addChild(xdatanode);
        return true;
    },
    "x-enum-reference": function(node){
        let keypair = this.data.find( (pairs) => pairs.numericValue == node.data);
        if(keypair == undefined){ return false; }
        node.data = keypair.identifier;
        return true;
    },
    "filter": function(node){
        //filter out all keys that arent' in the filter list
        node.children.forEach( (child) =>{
            let stays = this.data.find( (key) => child.key == key);
            if(stays == undefined)
                child.delete();
        });
        return true;
    },
    "group": function(node){
        Object.entries(this.data).forEach( ([key, arr]) => {
            let groupnode = new Node(key, false);
            let children = node.children.filter( (child) => arr.find( (arrkey) => child.key == arrkey));
            node.children = node.children.filter( (child) => children.find((groupchild) => groupchild == child) == undefined);
            children.forEach( (child) => groupnode.addChild(child));
            node.addChild(groupnode);
        });
        return true;
    },
};

class TransformFactory {
    constructor(language){
        this.language = language;
        this.manifest = getManifest(this.language);
    }
    buildTransformArray(options, schema){
        let functions = [];
        schemakeywords.forEach( (key) => {
            if(options[key] && schema[key]){
                switch(key){
                    case "x-enum-reference": {
                        let keylist = guide.parseSchemaRef(schema["x-enum-reference"]["$ref"]);
                        let xenumvalues = guide.findSchema(keylist)[0]["x-enum-values"];
                        functions.push(new BuildTransform(key, xenumvalues));
                        break;
                    }
                    case "x-mapped-definition": {
                        let keys = guide.parseSchemaRef(schema["x-mapped-definition"]["$ref"]);
                        keys = guide.parseSchemaRef(keys.pop(), ".");
                        functions.push(new BuildTransform(key, { keys: keys, data: this.manifest}));
                        break;
                    }
                }
            }
        });
        serverkeywords.forEach( (key) => {
            if(skipkeywords.find( (skipkey) => key === skipkey) !== undefined)
                return true;
            if(options[key] != undefined)
                functions.push(new BuildTransform(key, options[key]));
        });
        return functions;
    }

}

class BuildTransform {
    constructor(key, data){
        this.data = data;
        this.transform = transformFunctions[key].bind(this);
    }
}

module.exports = TransformFactory;