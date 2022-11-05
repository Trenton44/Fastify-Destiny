const guide = require("./json-schema-controller.js");
const Node = require("./node.js");

class NodeController {
    constructor(config={}){
        this.config = config;
        this.root = null;
    }
    searchNode(keylist){
        let node = this.root;
        while(keylist.length > 0){
            node = node.find( (child) => child.key == keylist.shift()) || false;
            if(!node){ return false; }
        }
        return node;
    }
    addNode(keylist, node){
        let parent = this.searchNode(keylist);
        if(parent instanceof Node)
            parent.addChild(node);
        else
            throw Error("Unable to find node with the given keylist.");
        return true;
    }
    deleteNode(nodelocation){
        if(nodelocation instanceof Node){
            nodelocation.delete();
            return true;
        }
        let node = this.searchNode(nodelocation);
        if(!(node instanceof Node))
            throw Error("Unable to find node with the given keylist.");
        node.delete();
        return true;
        
    }
    moveNode(newparent, node){
        node.parent.removeChild(node);
        newparent.addChild(node);
    }
    #connectLinks(){
        let links = {};
        let linkNodes = this.#getNodesByOption("link");
        linkNodes.forEach( (node) => {
            let link = node.options.link;
            let targetnode = false;
            let keyused = child.key;
            let newkey = child.parent.key;
            if(link[0] = "!"){
                targetnode = true;
                link = link.slice(1);
            }
            if(link != "key"){
                let linkvar = child.children.find( (cchild) => cchild.key == link);
                if(linkvar == -1){ throw Error("Could not find child "+link+" in node "+child.key); }
                keyused = linkvar.data;
                newkey = keyused+"Mapped";
            }
            if(!links[keyused]){ links[keyused] = []; }
            if(istarget)
                links[keyused].unshift(child);
            else
                links[keyused].push(child);
            child.key = newkey;
        });
        Object.entries(links).forEach( ([linkkey, linklist]) =>{
            let targetnode = linklist.shift();
            while(linklist.length > 0)
                this.moveNode(targetnode, linklist.shift());
            delete links[linkkey]; //remove entirely
        });
        return true; // links should once again be an empty object by this point
    }
    #getNodesByOption(key){ return this.root.getChildrenWithOption(key); }
    #getNodesByKey(key){ return this.root.getChildrenMatchingKey(key); }
    compileTree(){
        this.#connectLinks();
        if(this.config.splice){
            let splicenodes = [...this.#getNodesByKey("data"), ...this.#getNodesByKey("items")];
            splicenodes.forEach( (node) => {
                let parent = node.parent;
                let children = node.children;
                node.delete();
                children.forEach( (child) => parent.addChild(child));
            });
        }
        return this.root.compile(); 
    }
}

module.exports = NodeController;