require("dotenv").config({ path: ".env" });
process.env.NODE_ENV="testing"
const session = require("./session.js");
const build = require("../app.js");
const opts = require("../settings.js")(process.env.NODE_ENV);
const app = build(opts);

jest.mock("./session.js", () => {
    const original = jest.requireActual("./session.js");
    return {
        ...original,
        buildSession: jest.fn(()=> {
            let temp = original.buildSession();
            temp.__querycode = true;
            return temp;
        }),
        validateSession: jest.fn(async (session) => true), //completely skip validation
        validateProfiles: jest.fn(async (request) => { //skip validation, but add a fake profile in to ensure / returns the correct value
            request.session._user.active = "12345";
            request.session._user.profiles = {
                "12345": {
                    "potato": "beans"
                }
            }
        })
    };
});

test("endpoint '/' should return the active profile", async () => {
    let result = await app.inject({
        method: "GET",
        url: "/"
    });
    expect(result.statusCode).toEqual(200);
    expect(result.json()).toEqual({
        "potato": "beans"
    });
})