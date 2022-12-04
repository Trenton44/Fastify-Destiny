import { jest } from "@jest/globals";

import app from "../app.js";
let cookies = null;
beforeAll(async () => {
    // make a request to initialize the session in the DB
    let result = await app.inject({
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

afterAll(async () => await app.close());