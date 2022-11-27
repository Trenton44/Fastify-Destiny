const { connectDatabase } = require("../test.functions.js");
const fastify = require("fastify");
const { UserUnauthorized } = require("./errortypes");
process.env.MONGO_DB_URL = global.__MONGO_URI__;

jest.mock("./session-settings.js", () => {
    return {
        ...jest.requireActual("./session-settings.js"),
        // override idGenerator to return one value, for easy validation of session. note that only one session should ever exist through these tests.
        idGenerator: jest.fn((request) => "test"+process.env.JEST_WORKER_ID),
        cookie: {
            path: "/",
            maxAge: 3600000,
            secure: false,
        },
        store: require("connect-mongo").create({
            mongoUrl: process.env.MONGO_DB_URL,
            dbName: process.env.MONGO_DB_NAME,
            collectionName: process.env.MONGO_DB_COLLECTION,
            stringify: false,
        })
    };
});
jest.setTimeout(10000);
let mongo = null;
let db = null;
let collection = null;
const app = fastify();
const Bungie = require("./plugin.js");
app.register(Bungie);


beforeAll(async () => {
    mongo = await connectDatabase(global.__MONGO_URI__);
    db = await mongo.db(process.env.MONGO_DB_NAME);
    collection = await db.collection(process.env.MONGO_DB_COLLECTION);
});
beforeEach(async () => {});

test("Accessing an endpoint should return a session cookie", async () => {
    let request = await app.inject({
        method: "GET",
        url: "/"
    });
    // validate that session cookie has been set.
    expect(request.cookies).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                name: process.env.COOKIE_NAME
            })
        ])
    );
});

test("Corresponding session should exist inside DB", async () => {
    let ses = await collection.find().toArray();
    console.log(ses);
    expect(ses).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                _id: "test"+process.env.JEST_WORKER_ID
            })
        ])
    );
});


//afterEach(async () => );
afterAll(async () => {
    await collection.deleteMany({});
    await mongo.close();
});