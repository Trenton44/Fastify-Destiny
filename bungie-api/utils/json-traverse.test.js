let guide = require("./json-traverse.js");

test("tryTraversal() should return false on invalid obj location.", () => {
    let test = {};
    expect(guide.tryTraversal(["beans", "peas"], test)).toEqual(false);
    test = {
        "beans": {
            "potatoes": []
        }
    }
    expect(guide.tryTraversal(["beans", "apples"], test)).toEqual(false);
});

test("tryTraversal() should return reference to obj location if found.", () => {
    let test = {
        "beans": {
            "peas": "apples"
        },
        "yeast": [1, 2, "yes"]
    };
    expect(guide.tryTraversal(["beans"], test)).toEqual(test.beans);
    expect(guide.tryTraversal(["yeast"], test)).toEqual(test.yeast);
    expect(guide.tryTraversal(["beans", "peas"], test)).toEqual(test.beans.peas);
});

test("tryTraversal() should throw an error if no object is passed.", ()=> {
    expect(() => guide.tryTraversal(["hello"])).toThrow();
});

test('parseRef() should default to / if no delimiter is given', () => {
    let test = "Destiny.Profiles.Responses";
    expect(guide.parseRef(test)).toEqual(["Destiny.Profiles.Responses"]);
});

test('parseRef() should correctly split a string using a given delimiter', () => {
    let test = "Destiny.Profiles.Responses";
    expect(guide.parseRef(test, ".")).toEqual(["Destiny", "Profiles", "Responses"]);
    test = "Destiny.Profiles.Responses";
    expect(guide.parseRef(test, ".")).toEqual(["Destiny", "Profiles", "Responses"]);
});

test("findSchema() should default to searching the openapi.json doc", () => {
    expect(guide.findSchema([])).toEqual([require("../manifests/openapi.json"), false]);
});

test('findSchema() should return [false, false] if no json object is found', () => {
    expect(guide.findSchema(["invalidkeyforopenapi"])).toEqual([false, false]);
    expect(guide.findSchema(["invalidkeyforobject"], {})).toEqual([false, false]);
});

test('findPath() should throw an error if no openapi "paths" key is passed.', () => {
    expect(() => guide.findPath(null, "get")).toThrow();
});

test("findPath() should throw if no request type is passed.", () => {
    expect(() => guide.findPath("invalidkey")).toThrow();
});

test("findPath() should throw an error if passed openapi 'paths' key is invalid.", () => {
    expect(() => guide.findPath("invalidpathkey", "get")).toThrow();
});