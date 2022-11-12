class Node{
    constructor(key, options={}, functions=[]){
        if(!key)
            throw Error("Node instance requires a key parameter.");
        this.key = key;
        this.options = options;
        this.transforms = functions;
        this.children = [];           
    }
    addChild(node){
        node.parent = this;
        this.children.push(node);
        return true;
    }
    delete(){
        this.parent.deleteChild(this);
    }
    deleteChild(node){
        this.removeChild(node);
        node.children.forEach( (child) => child.parent = null);
        node = null;
        return true;
    }
    removeChild(node){
        let index = this.children.findIndex( (child) => child === node);
        if(index == -1)
            return false;
        this.children.splice(index, 1);
        node.parent = null;
        return node;
    }
    getChildrenWithOption(key){
        let list = [];
        this.children.forEach( (child) => list.splice(list.length -1, 0, ...child.getChildrenWithOption(key)));
        return this.options[key] ? [this, ...list] : list;
    }
    getChildrenMatchingKey(key){
        let list = [];
        this.children.forEach( (child) => list.splice(list.length -1, 0, ...child.getChildrenMatchingKey(key)));
        return this.key == key ? [ this, ...list] : list;
    }
    transform(){
        this.transforms.forEach( (func) => func.transform(this));
        this.children.forEach( (child) => child.transform());
        return true;
    }
    compile(){
        if(this.data != undefined)
            return this.data;
        if(this.children.length == 0){
            this.delete();
            return undefined;
        }
        this.data = {};
        this.children.forEach( (child) => child.compile());
        this.children.forEach( (child) => this.data[child.key] = child.data);
        return this.data;
        
    }
}

module.exports = Node;