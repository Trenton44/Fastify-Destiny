process.env.MONGO_DB_URL = global.__MONGO_URI__;
jest.mock("./session_settings.js");
let mongo = null;
const app = global.buildServer();

beforeAll(async () => mongo = await global.connectDatabase(global.__MONGO_URI__));
beforeEach(async () => {});

describe("Ensure that the session cookie is properly set and session data appears in the database.", () => {
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
        let ses = await mongo.collection.find().toArray();
        expect(ses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    _id: "test"+process.env.JEST_WORKER_ID
                })
            ])
        );
    });

    afterAll(async () => await mongo.collection.deleteMany({}));
});

afterEach(async () => {});
afterAll(async () => {
    await app.close();
    await mongo.client.close();
});