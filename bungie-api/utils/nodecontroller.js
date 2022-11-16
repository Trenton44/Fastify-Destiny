const Node = require("./node.js");

class NodeController {
    constructor(config){
        this.config = config;
        this.root = null;
    }
    searchNode(refkeys){
        let node = this.root;
        while(refkeys.length > 0){
            node = node.children.find( (child) => child.key === refkeys.shift());
            if(!node)
                return false;
        }
        return node;
    }
    addNode(refkeys, node){
        let parent = this.searchNode(refkeys);
        return parent instanceof Node ? parent.addChild(node) : Error("Unable to find node with given keylist.");
    }
    deleteNode(location){
        if(location instanceof Node)
            location.delete();
        else {
            let node = this.searchNode(location);
            return node instanceof Node ? node.delete() : Error("Unable to find node with given keylist.");
        }
    }
    moveNode(newparent, node){
        node.parent.removeChild(node);
        newparent.addChild(node);
        return true;
    }
    #connectLinks(){
        let links = {};
        let linkNodes = this.#getNodesByOption("link");
        linkNodes.forEach( (node) => {
            let link = node.options.link;
            if(link == "key"){
                if(!links[node.key]){ links[node.key] = []; }
                links[node.key].push(node);
                return true;
            }
            else {
                //if not "key", we are using the key of one of it's child attributes
                // if not "key", we are also assuming this is the target for all other data.
                let linkvar = node.children.find( (cchild) => cchild.key == link);
                if(linkvar == undefined){ return false; } // some items may not have the desired key, like itemInstanceId. In this scenario, just move on.
                if(!links[linkvar.data]){ links[linkvar.data] = []; }
                links[linkvar.data].unshift(node);
                links[linkvar.data].unshift(link+"Mapped");
                return true;
            }
        });
        Object.entries(links).forEach( ([linkkey, linklist]) => {
            if(linklist[0] instanceof Node){
                // this is a list entirely made of nodes with link = "key".
                //combine them all under the linkkey, add that key to their parent
                //Note: They should all share a common parent
                let targetnode = new Node(linkkey);
                let parentlist = [];
                linklist.forEach( (node) => parentlist.push(node.parent));
                //while the parents of the nodes doesn't match up, go up a parent and compare them
                while(!parentlist.every((current) => current == parentlist[0])){
                    parentlist = parentlist.map((parent) => parent.parent);
                }
                // somewhere in the hierarchy, a common parent was found, so take it
                let parent = parentlist[0];
                while(linklist.length > 0){
                    let temp = linklist.shift();
                    temp.key = temp.parent.key;
                    this.moveNode(targetnode, temp);
                }
                // they all shared a parent, take the ref from one of them and add the newly grouped node to it
                parent.addChild(targetnode);
            }
            else{
                // this is a list with a node that should be targeted
                // combine array data to that node under the string in the first slot
                let targetId = linklist.shift();
                let targetnode = linklist.shift();
                while(linklist.length > 0){
                    let temp = linklist.shift();
                    temp.key = targetId;
                    this.moveNode(targetnode, temp);
                }
            }
            
        });
        return true; // links should once again be an empty object by this point
    }
    #getNodesByOption(key){ return this.root.getChildrenWithOption(key); }
    #getNodesByKey(key){ return this.root.getChildrenMatchingKey(key); }
    #removeNodes(nodearr){ nodearr.forEach( (node) => node.delete()); }
    #spliceNodes(nodearr){
        nodearr.forEach( (node) => {
            node.children.forEach( (child) => node.parent.addChild(child));
            node.delete();
        }); 
    }
    compileTree(){
        this.#removeNodes(this.#getNodesByKey("privacy"));
        this.#spliceNodes(this.#getNodesByKey("data"));
        this.#spliceNodes(this.#getNodesByKey("items"));
        this.root.transform();
        this.#connectLinks();
        return this.root.compile();
    }
}

module.exports = NodeController;