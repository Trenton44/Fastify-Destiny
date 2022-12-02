const template = require("./template.js");

test("template module returns an object.", 
    () => expect(template()).toBeInstanceOf(Object)
);
test("template should always give a new object instance.", () => {
    let temp = template();
    temp._user = "test";
    expect(temp).not.toEqual(template());
});

test("Session language should be 'en' by default.", () => {
    const temp = template();
    expect(temp._user.language).toEqual("en");
});