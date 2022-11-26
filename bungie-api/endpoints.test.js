const { mockUserSession, connectDatabase } = require("../test.functions.js");
const request = require("supertest");
process.env.MONGO_DB_URL = global.__MONGO_URI__;

jest.mock("./session-settings.js", () => {
    //override the session id generator, to point to the mock session data.
    //override the mongo session to not encrypt or ssl data, as tests are ephemeral and validate actual session data
    return {
        ...jest.requireActual("./session-settings.js"),
        idGenerator: jest.fn((request) => "test"+process.env.JEST_WORKER_ID),
        store: require("connect-mongo").create({
            mongoUrl: process.env.MONGO_DB_URL,
            dbName: process.env.MONGO_DB_NAME,
            collectionName: process.env.MONGO_DB_COLLECTION,
            stringify: false,
        }),
        cookie: {
            path: "/",
            sameSite: "Strict",
            httpOnly: false,
            maxAge: 3600000,
            secure: false,
        }
    };
});
jest.mock("../settings.js", () => {
    return jest.fn((env) => {
        return {
            trustProxy: false,
            logger: true
        };
    });
})
describe("These tests should verify functionality of session retrieval/access.", () => {
    let connection = null;
    let db = null;
    let collection = null;
    const app = require("../app.js")(require("../settings.js")(process.env.NODE_ENV));
    beforeAll(async () => {
        connection = await connectDatabase(global.__MONGO_URI__);
        db = await connection.db();
        collection = await db.collection(process.env.MONGO_DB_COLLECTION);
    });
    beforeEach(async () => {
        //this will need to mock connect-mongo and return it's session data
        await collection.insertOne({
            sessionId: "test12345",
            data: "beans"
        });
    });

    test("validate that user session exists in the mongo DB.", async () => {
        expect(collection.findOne({ sessionId: "test12345" })).resolves.toBeInstanceOf(Object);
    });

    afterEach(async () => await collection.deleteMany({}));
    afterAll(async () => await connection.close());
});




