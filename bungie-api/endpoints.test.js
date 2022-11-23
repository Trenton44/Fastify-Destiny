require("dotenv").config({ path: ".env" });
process.env.NODE_ENV="testing"
const { MongoClient } = require("mongodb");
let connection = null;
let db = null;

beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    db = await connection.db();
});

test(" db connection is valid and exists.", () => {
    expect(connection).not.toBe(false);
    expect(db).not.toBe(false);
    console.log(connection);
    console.log(db);
});

afterAll(async () => await connection.close());