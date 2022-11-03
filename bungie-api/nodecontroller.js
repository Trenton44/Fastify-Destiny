const guide = require("./json-schema-controller.js");
const Node = require("./node.js");

class NodeController {
    constructor(config){
        //  hierarchy is effectively a copy of the openapi schema, at initial creation.
        //  it then may deviate based on user config, and this is to act as a new "schema" that maintains those changes
        this.hierarchy = {};
        this.root = null;
        this.config = config;
        this.links = {};
    }
    #searchNode(keylist){
        let node = this.root;
        while(keylist.length > 0){
            node = node.find((child) => child.key == keylist.shift());
            if(!(node instanceof Node)){ return false; }
        }
        return node;
    }
    #removeNodeFromLocation(keylist){
        let node = this.#searchNode(keylist);
        if(!node)
            throw Error("Unable to find Node with the given keylist");
        this.#removeChildNodeq(node);
        return true;
    }
    #removeChildNode(node){ node.removeSelf(); }
    removeNode(nodelocation){
        if(nodelocation instanceof Node)
            this.#removeChildNode(nodelocation);
        else
            this.#removeNodeFromLocation(nodelocation);
        return true;
    }
    #addChildNode(parent, child){ parent.addChild(child); }
    #addChildToLocation(keylist, child){
        let parent = this.#searchNode(keylist);
        if(!node)
            throw Error("Unable to find parent node with the given keylist");
        this.#addChildNode(parent, child);
    }
    addNode(nodelocation, child){
        if(nodelocation instanceof Node)
            this.#addChildNode(nodelocation, child)
        else
            this.#addChildToLocation(nodelocation, child);
        return true;
    }
    compileTree(){
        if(this.config.splice)
            this.root.pruneChildren(this.config.splice);
        return this.root.compile();
    }
    compileLinks(node, reset=false){
        if(reset){ this.links = {}; }
        for(let child of node.children){
            if(child.options.link){
                if(child.options.link == "key"){
                    if(!this.links[child.key]){ this.links[child.key] = []; }
                    this.links[child.key].push(child);
                }
                else {
                    for(let childnode of child){
                        if(childnode.key == child.options.link){
                            if(!this.links[childnode.data]){ this.links[childnode.data]; }
                            this.links[childnode.data].push(child);
                        }
                    }
                    if(!this.links[child.options.link]){ this.links[child.options.link] = []; }
                    this.links[child.options.link].push(child);
                }
            }
        }
        console.log("done");
        console.log(this.links);
    }
}

module.exports = NodeController;