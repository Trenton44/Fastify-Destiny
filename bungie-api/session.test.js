const session = require("./session.js");

test("Running buildSession() should return a new session object", () => {
    let one = session.buildSession();
    let two = session.buildSession();
    expect(one).not.toBe(two);
});