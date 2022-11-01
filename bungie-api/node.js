const guide = require("./json-schema-controller.js");
const inheritable = [ "x-mapped-definition", "x-enum-values" ];
const uninheritable = [ "reduce", "filter", "attach", "combine", "group" ];

class NodeController {
    constructor(config){
        //  hierarchy is effectively a copy of the openapi schema, at initial creation.
        //  it then may deviate based on user config, and this is to act as a new "schema" that maintains those changes
        this.hierarchy = {};
        this.root = null;
        this.config = config;
    }
    removeNode(node){
        if(!node.parent)
            throw Error("Unexpected: Node does not have parent.");
        let parent = node.parent;
        let children = node.children;
        parent.children = [...parent.children, ...children];
        node = null;
    }
    compileNodeTree(){
        if(this.config.condense)
            this.root.pruneTree(["data", "items"]);
        return this.root.compileData();
    }
}

class Node {
    constructor(parent, key, schema, config, definition){
        this.parent = parent;
        this.key = key;
        this.schema = schema;
        this.config = config;
        this.options = this.parseConfig(config);
        this.definition = definition;
        this.data = undefined;
        this.children = [];
    }
    addChild(key, schema, config, definition){
        let childnode = new Node(this, key, schema, config, definition);
        this.children.push(childnode);
        return childnode;
    }
    enforceOptionPriority(key, config){
        let option = undefined;
        if(config.dependency && config.dependency[key] != undefined)
            option = config.dependency[key];
        if(config.ref && config.ref[key] != undefined)
            option = config.ref[key]; // override dependency if it exists
        if(config.property && config.property[key] != undefined)
            option = config.property[key]; // override ref if it exists
        return option;
    }
    parseConfig(config){
        let options = {};
        for(let key of uninheritable){
            options[key] = this.enforceOptionPriority(key, config);
            if(options[key] == undefined){ options[key] = false; } //if nothing is found, default to false
        }
        for(let key of inheritable){
            options[key] = this.enforceOptionPriority(key, config);
            // if undefined, the schemas for this node don't have it. 
            // it's parent would have the most recently inherited value, pull from it
            if(options[key] == undefined){
                if(this.parent);
                    options[key] = this.parent.options[key];
            }
            
        }
        return options;
    }
    printChildren(){
        console.log(this.config);
        console.log("Key: "+this.key);
        console.log("This options: ");
        console.log(this.options);
        console.log("Data: "+this.data);
        console.log("Children: ");
        for(let child of this.children)
            child.printChildren();
    }
    appendData(key, data){
        let datanode = new Node(this, key, false, {property: false, ref: false, dependency: false });
        datanode.data = data;
        this.children.push(datanode);
    }
    GetXMappedDefinition(){
        let keys = this.schema["x-mapped-definition"]["$ref"];
        keys = guide.parseSchemaRef(keys);
        let definitionkey = guide.parseSchemaRef(keys[keys.length - 1], ".");
        definitionkey = definitionkey.pop();
        this.parent.appendData(this.key+"Mapped", guide.traverseObject([definitionkey, this.data], this.definition));
        return true;
    }
    GetXEnumReference(){
        let keylist = guide.parseSchemaRef(this.schema["x-enum-reference"]["$ref"]);
        let xenumschema = guide.findSchema(keylist)[0];
        if(!xenumschema){ return false; }
        for(let element of xenumschema["x-enum-values"]){
            if(element.numericValue == this.data){
                if(this.options["x-enum-values"]){ this.data = element.identifier; }
                else{ this.data = element.numericValue; }
                return ;
            }
        }
    }
    filterNodes(keylist){
        for(let i= 0; i < this.children.length; i++){
            let child = this.children[i];
            let keepchild = false;
            for(let key of keylist){
                if(child.key == key){
                    keepchild = true;
                    break;
                }
                    
            }
            if(!keepchild){
                this.children.splice(i, 1);
                i -= 1; // subtract one, to re-evaluate the same spot, now that a new node is in it
            }
        }
    }
    transform(){
        if(this.schema["x-mapped-definition"] && this.options["x-mapped-definition"])
            this.GetXMappedDefinition();
        if(this.schema["x-enum-reference"])
            this.GetXEnumReference();
        if(this.options["filter"])
            this.filterNodes(this.options["filter"]);
        
        
    }
    compileData(){
        if(this.data == undefined){
            this.data = {};
            for(let child of this.children)
                child.compileData();
            this.transform();
            for(let child of this.children)
                this.data[child.key] = child.data;
                return this.data;
        }
        else{
            this.transform();
            return this.data;
        }     
    }
    pruneTree(keylist){
        for(let i in this.children){
            let child = this.children[i];
            for(let key of keylist){
                if(child.key == key){
                    let child_children = child.children;
                    this.children.splice(i, 1, ...child_children); //remove the node with key, and replace it with it's children
                    this.pruneTree(keylist); // new child has been appended, run again so it can be checked too
                }
            }
        }
        for(let child of this.children)
            child.pruneTree(keylist);
    }
}

module.exports = { NodeController, Node};