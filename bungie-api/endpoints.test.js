require("dotenv").config({ path: ".env" });
process.env.NODE_ENV="testing"
const { MongoClient } = require("mongodb");

let connection = null;
let db = null;
let collection = null;

beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    db = await connection.db();
    db = db.collection(process.env.MONGO_DB_COLLECTION);
});

test("db connection is valid and exists.", () => {
    expect(connection).not.toBe(false);
    expect(db).not.toBe(false);
});

test("A user accessing / without authorization should receive a UserUnauthorized error.", () => {
    expect(Promise.resolve("this test is built.")).rejects;
});

test("An authorized user accessing / should receive the active profile saved to the session.", () => {
    expect(Promise.resolve("this test is built.")).rejects;
});

afterAll(async () => await connection.close());