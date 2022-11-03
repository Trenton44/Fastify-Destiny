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
        this.#compileLinks(this.root, true);
        if(Object.keys(this.links) != 0)
            this.#ConnectLinks(); // connect all of the linked data together
        return this.root.compile();
    }
    #pushLink(key, node, istarget){
        if(!this.links[key])
            this.links[key] = [];
        if(istarget)
            this.links[key].unshift(node); // add target node to front of array
        else
            this.links[key].push(node); // add node to the list
        return true;
    }
    #compileLinks(node, reset=false){
        if(reset){ this.links = {}; }
        node.children.forEach( (child) => {
            let link = child.options.link;
            if(!link)
                return false; //if link is undefined or false, no need to check any further
            let istarget = false; // whether this node is the target for all others to be appended to
            if(link[0] == "!"){ 
                istarget = true; 
                link = link.slice(1); //remove exclamation point, it'll mess up comparisons
            }

            // if the value of the option is "key", we want to use this node's key to link the data
            // useful for linking two objects, like a character's inventory and equipment, which are under two different object, but both keyed by the character's id.
            if(link == "key"){
                this.#pushLink(child.key, child, target);
                return true;
            }
            // if it is another value, we want to link this node with others based on the data value of one of it's children.
            // Ex: itemInstanceComponents are keyed by itemInstanceId, character items have a child node called "itemInstanceId".
            // we link that node by it's itemInstanceId key to 
            let linkvalue = child.children.find( (cchild) => cchild.key == link);
            if(linkvalue == -1)
                return false; // child key didn't match desired key, move to next child.
            linkvalue = linkvalue.data; // use the data value of the child node
            child.parentkey = child.parent.key; // since all of them are being linked together by one key, we'll use the parent's key to differentiate which came from where
            this.#pushLink(linkvalue, child, istarget);
        });

        node.children.forEach((child) => this.compileLinks(child)); //check each subsequent child for any "link" option keywords
        return true;
    }
    #ConnectLinks(){
        Object.entries(this.links).forEach( ([linkkey, nodelist]) => {
            let target = nodelist.pop(); // first element in each list is target, which was decided by the ! in the link option's value
            nodelist.forEach( (node) => target.addChild(node));
        });
    }
}

module.exports = NodeController;