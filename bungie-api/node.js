const guide = require("./json-schema-controller.js");
const inheritable = [ "x-mapped-definition", "x-enum-values" ];
const uninheritable = [ "filter", "group", "link" ];

class Node {
    constructor(parent, key, schema, config, definition){
        this.parent = parent;
        this.key = key;
        this.schema = schema;
        this.config = config;
        this.options = this.#parseConfig(config);
        this.definition = definition;
        this.data = undefined;
        this.isdictkey = false;
        this.children = [];
    }
    #enforceOptionPriority(key, config){
        let option = undefined;
        if(config.dependency && config.dependency[key] != undefined)
            option = config.dependency[key];
        if(config.ref && config.ref[key] != undefined)
            option = config.ref[key]; // override dependency if it exists
        if(config.property && config.property[key] != undefined)
            option = config.property[key]; // override ref if it exists
        return option;
    }
    #parseConfig(config){
        let options = {};
        uninheritable.forEach( (key) => { 
            options[key] = this.#enforceOptionPriority(key, config);
            if(options[key] == undefined){ options[key] = false; } //if nothing is found, default to false
        });
        inheritable.forEach( (key) => {
            options[key] = this.#enforceOptionPriority(key, config);
            if(options[key] != undefined)
                return;
            if(this.parent){ options[key] = this.parent.options[key]; }
        });
    }
    addChild(node){
        node.parent = this;
        if(this.schema["x-dictionary-key"])
            node.isdictkey = true;
        this.children.push(node);
        return true;
    }
    removeSelf(){ this.parent.removeChild(this); }
    removeChild(node){
        let list = this.children.filter( (child) => child != node);
        this.children = list;
        node = null;
        // may need to come back and recursively remove all child nodes, which would go as a remove function in the node class
        // depends on if js garbage collector gets them
        return true;
    }
    compile(){
        //checks for undefined because some data stores boolean values.
        if(this.data != undefined){
            this.transform();
            return this.data;
        }
        this.data = {};
        this.children.forEach( (child) => child.compile()); //compile the children first, so they have data
        this.transform();  // transform data of child nodes
        this.children.forEach( (child) => this.data[child.key] = child.data); //compile this node's data from transformed children
        return this.data; // return compiled data upwards
    }
    #GetXMappedDefinition(){
        let keys = guide.parseSchemaRef(this.schema["x-mapped-definition"]["$ref"]);
        keys = guide.parseSchemaRef(keys.pop(), ".").pop(); // split the last item of keys by ".", and return the last item of the result
        let datanode = new Node(null, this.key+"Mapped", false, {property: false, ref: false, dependency: false }, this.definition);
        datanode.data = guide.traverseObject([keys, this.data], this.definition);
        this.parent.addChild(datanode);
    }
    #GetXEnumReference(){
        let keylist = guide.parseSchemaRef(this.schema["x-enum-reference"]["$ref"]);
        let xenumschema = guide.findSchema(keylist)[0];
        if(!xenumschema){ return false; }
        let keypair = xenumschema["x-enum-values"].find( (pairs) => pairs.numericValue == this.data);
        if(keypair == undefined)
            return false; // maybe throw a warning later, but for now just don't mess with the data
        if(this.options["x-enum-values"])
            this.data = keypair.identifier;
        else
            this.data = keypair.numericValue;
        return true;
    }
    #GroupChildren(){
        let groups = this.options["group"];
        Object.entries(group).forEach( ([groupkey, keylist]) => {
            let node = new Node(false, groupkey, false, {property: false, ref: false, dependency: false }, false);
            // get a list of all children whose key is in the list of children to be grouped
            let foundchildren = this.children.filter( (child) => keylist.find(child.key));
            // filter the list of children down to the ones that are NOT in the list to be grouped.
            this.children = this.children.filter( (child) => foundchildren.find(child) == undefined);
            node.children = foundchildren;
            this.children.addChild(node);
            node.isdictkey = false; //this is grouped, we do NOT want it to be shown as keyed
        });
    }
    transform(){
        if(this.schema["x-mapped-definition"] && this.options["x-mapped-definition"])
            this.#GetXMappedDefinition();
        if(this.schema["x-enum-reference"])
            this.#GetXEnumReference();
        if(this.options["filter"])
            this.children = this.children.filter( (child) => this.options["filter"].find(child.key)); //filter out all keys that arent' in the filter list
        if(this.options["group"])
            this.#GroupChildren();
    }
    pruneChildren(keylist){
        let pruneIndex = this.children.findIndex( (child) => keylist.find(child.key));
        if(pruneIndex != -1){
            let children = this.children[pruneIndex].children;
            children.forEach( (child) => child.parent = this); //replace old parent with this node
            this.children.splice(pruneIndex, 1, ...children); //remove the node with key, and replace it with it's children
            this.pruneChildren(keylist); // new child has been appended, run again so it can be checked too
        }
        this.children.forEach( (child) => child.pruneChildren(keylist));
    }
}

module.exports = Node;