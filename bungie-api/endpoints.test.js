
const { mockUserSession } = require("../test.functions.js");
describe("These tests should verify functionality of session retrieval/access.", () => {
    let db = null;
    let collection = null;
    beforeAll(async () => {
        db = await connectDatabase(global.__MONGO_URI__);
        collection = db.collection(process.env.MONGO_DB_COLLECTION);
        process.env.MONGO_DB_URL = global.__MONGO_URI__;
    });
    beforeEach(() => {
        //this will need to mock connect-mongo and return it's session data
        db.collection.insertOne(mockUserSession());
    });
    afterEach(() => {
        //wipe collection
    });
    afterAll(async () => closeDatabase(db));
});




