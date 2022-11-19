require("dotenv").config({ path: "../.env" });
process.env.NODE_ENV="testing";
const opts = require("../settings.js")(process.env.NODE_ENV);
const build = require("../app.js");
let app = build(opts);

test("accessing an invalid endpoint should return a 404 error", async () => {
    let result = await app.inject({
        method: "GET",
        url: "/completelyinvalidendpointthatshouldntexist"
    });
    expect(result.statusCode).toEqual(404);
});
