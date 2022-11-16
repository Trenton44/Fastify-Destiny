require("dotenv").config({ path: ".env" });
process.env.NODE_ENV="testing";
const opts = require("./settings.js")(process.env.NODE_ENV);
const build = require("./app.js");

test(' server should fail to load if no ORIGIN env variable exists', () => {
    let origin = process.env.ORIGIN;
    delete process.env.ORIGIN;
    expect(() => build(opts)).toThrow(Error);
    process.env.ORIGIN = origin;
});

test('Intializing production server should return the server object', () => {
    const opts = require("./settings.js")["production"];
    expect(build(opts)).toBeInstanceOf(Object);
});
