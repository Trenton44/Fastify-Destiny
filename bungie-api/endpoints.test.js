
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
        })
    };
});

const { mockUserSession } = require("../test.functions.js");
describe("These tests should verify functionality of session retrieval/access.", () => {
    let db = null;
    let collection = null;
    const app = require("../app.js")(require("./settings.js")(process.env.NODE_ENV));
    beforeAll(async () => {
        db = await connectDatabase(global.__MONGO_URI__);
        collection = db.collection(process.env.MONGO_DB_COLLECTION);
        process.env.MONGO_DB_URL = global.__MONGO_URI__;
    });
    beforeEach(() => {
        app.inject
        //this will need to mock connect-mongo and return it's session data
        db.collection.insertOne(mockUserSession());
    });
    test("validate that user session exists in the mongo DB.", async () => {

    });
    afterEach(() => {
        //wipe collection
        db.collection.deleteMany({});
    });
    afterAll(async () => closeDatabase(db));
});




