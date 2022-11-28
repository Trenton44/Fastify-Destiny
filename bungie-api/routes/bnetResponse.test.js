/*
    checks returned _state value against _state stored in session.
        if they do not match, destroys session
        if they do not match, returns 400 error
    if _state parameter is validated, request correctly stores query code into user session
    valid request correctly returns a 303 redirect to page stored in ORIGIN env variable
*/
process.env.MONGO_DB_URL = global.__MONGO_URI__;
const app = global.buildServer();
let mongo = null;
let cookie = null;

beforeAll(async () => mongo = await global.connectDatabase(global.__MONGO_URI__));
beforeEach(async () => {
    //ping an endpoint to create the session and get the cookie
    let result = await app.inject({
        method: "GET",
        url: "/login"
    });
    cookie = result.cookies.find( element => element.name == process.env.COOKIE_NAME);
});

test("Recieving an invalid _state parameter should destroy the session and return a 400 error.", async () => {
    await mongo.collection.updateOne(
        { _id: global.sessionID(process.env.JEST_WORKER_ID) },
        { "$set": { "session.user._state": "invalid state parameter" } }
    );
    let result = await app.inject({
        method: "GET",
        url: "/bnetResponse",
        query: { state: "astateparameterthatshouldnotmatch" },
        cookies: { cookie }
    })
    expect(result.statusCode).toEqual(400);
    result = result.json();
    expect(result.error).toBeTruthy();
});

afterEach(async () => await mongo.collection.deleteMany({}));