import Node from "./node.js";

test("Node instance throws error if it is not given a key upon instantiation.", () =>{
    expect(() => test = new Node()).toThrow();
    expect(() => new Node()).toThrow();
});

test("addChild() adds passed node to children, and update's its parent value.", () => {
    let node = new Node("testparent");
    let child = new Node("testchild");
    node.addChild(child);
    expect(child.parent).toEqual(node);
    expect(node.children).toContainEqual(child);
});

test("deleteChild() correctly removes child node from parent", () => {
    let child = new Node("testchild");
    let parent = new Node("testparent");
    parent.addChild(child);
    parent.deleteChild(child);
    expect(parent.children).not.toContainEqual(child);
});

test("deleteChild() removes references to child from it's children.", () => {
    let node = new Node("testnode");
    let child = new Node("testchild");
    let child1 = new Node("testchild1");
    let child2 = new Node("testchild2");
    let parent = new Node("testparent");
    parent.addChild(node);
    expect(parent.children).toContainEqual(node);
    node.addChild(child);
    expect(node.children).toContainEqual(child);
    node.addChild(child1);
    expect(node.children).toContainEqual(child1);
    node.addChild(child2);
    expect(node.children).toContainEqual(child2);
    parent.deleteChild(node);
    expect(child.parent).toEqual(null);
    expect(child1.parent).toEqual(null);
    expect(child2.parent).toEqual(null);
});

test("deleteChild() nullifies original node object", () => {
    let node = new Node("testnode");
    let parent = new Node("testparent");
    parent.addChild(node);
    expect(parent.children).toContainEqual(node);
    parent.deleteChild(node);
    expect(node).toEqual(null);
});

test("removeChild() removes child from list", () => {
    let node = new Node("testnode");
    let parent = new Node("testparent");
    parent.addChild(node);
    expect(parent.children).toContainEqual(node);
    parent.removeChild(node);
    expect(parent.children).not.toContainEqual(node);
    expect(node).toBeInstanceOf(Node);
})