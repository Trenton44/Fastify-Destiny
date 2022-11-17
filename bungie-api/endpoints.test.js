require("dotenv").config({ path: "../.env" });
process.env.NODE_ENV="testing";
let opts = require("../settings.js")(process.env.NODE_ENV);
let app = require("../app.js");

test("", async () => {
    app = app(opts);
    let result = await app.inject({
        method: "GET",
        url: "/"
    });
    expect(result.statusCode).toEqual(200);
});
