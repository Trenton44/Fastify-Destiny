const guide = require("./json-schema-controller.js");
const inheritable = [ "x-mapped-definition", "x-enum-values" ];
const uninheritable = [ "filter", "group", "link" ];

/**
 * @class Node
 * @param { string } key - the key from the JSON Object this node was created from
 * @param { Object } options - Options object containing necessary info about this object
 * @param { Function[] } - list of transformations this object will carry out to it's data at compile time
 */
class Node {
    constructor(key, options={}, functions=[]){
        if(key == undefined){ throw Error("Instance of Node requires 'key'"); }
        this.key = key;
        this.options = options;
        this.transformfunctions = functions;
        this.children = [];
    }
    /**
     * Adds a child to this node, changing it's parent node to this
     * @param { @link Node } node 
     */
    addChild(node){
        node.parent = this;
        this.children.push(node);
    }
    /**
     * Deletes this node via it's parent, and wipes all data
     */
    delete(){ this.parent.deleteChild(this); }
    /**
     * removes this node from the current parent, retaining all data/children
     * @param { @link Node } node 
     */
    removeChild(node){ this.children = this.children.filter( (child) => child != node); }
    /**
     * Deletes a child from list of children, removes reference to parent, and finally wipes the node
     * @param { @link Node} node 
     */
    deleteChild(node){
        this.removeChild(node);
        node.children.forEach( (child) => child.parent = null);
        node = null;
    }
    transform(){
        this.transformfunctions.forEach( (func) => func.transform(this));
    }
    /**
     * Compiles all children, then transforms the resulting data and returns it
     * @returns { Object } - the compiled data from this node's children, post transformation
     */
    compile(){
        if(this.data != undefined){
            this.transform();
            return this.data;
        }
        if(this.children.length == 0) // if no children, and no this.data, no point in compiling, nullify it.
            this.delete();
        this.data = {};
        this.transform();
        this.children.forEach( (child) => child.compile());
        this.children.forEach( (child) => this.data[child.key] = child.data);
        return this.data;
    }
    getChildrenWithOption(key){
        let list = [];
        this.children.forEach( (child) => { list = [...list, ...child.getChildrenWithOption(key)]; });
        if(this.options[key])
            list.unshift(this);
        return list;
    }
    getChildrenMatchingKey(key){
        let list =[];
        this.children.forEach( (child) =>{ list = [...list, ...child.getChildrenMatchingKey(key)]; });
        if(this.key == key)
            list.unshift(this);
        return list;
    }
    group(keyword, childkeys){
        let node = new Node(keyword, false);
        let children = this.children.filter( (child) => childkeys.find(child.key));
        this.children = this.children.filter( (child) => children.find(child) == undefined);
        this.addChild(node);
    }
}

module.exports = Node;