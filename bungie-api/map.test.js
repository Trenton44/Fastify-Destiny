let DataMap = require("./map.js");
test('Map.js should return an instance of DataMap', () =>{
    let map = new DataMap({}, {});
    expect(map).toBeInstanceOf(DataMap);
});

test('DataMap instance should throw if it is not given a manifest', () => {
    expect(() => new DataMap({})).toThrow();
});

test('A request object parameter with no data should throw an error', () => {
    let map = new DataMap({}, {});
    expect(() => map.start({}, {}, {})).toThrow(); // no data in request object should cause it to fail to find a schema.
});

test('A request object with invalid parameters should throw an error', () => {
    let map = new DataMap({}, {});
    expect( () => map.start({
        link: "",
        code: "2035908324",
        type: "post"
    })).toThrow();
});

// tests for the DataMap class function buildCustomOptions
