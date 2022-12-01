jest.mock("./session/store.js");
jest.mock("./session/settings.js");

let cookies = null;
beforeAll(async () => {
    // make a request to initialize the session in the DB
    let result = await global.App.inject({
        method: "GET",
        url: "/"
    });
    cookies = result.cookies;
});

test("Accessing an endpoint should return a session cookie", async () => {
    // validate that session cookie has been set.
    expect(cookies).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                name: process.env.COOKIE_NAME
            })
        ])
    );
});

test("Corresponding session should exist inside DB", async () => {
    expect(await global.MongoCollection.find().toArray()).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                _id: global.sessionID
            })
        ])
    );
});