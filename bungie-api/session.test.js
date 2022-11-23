let mockAxios = jest.createMockFromModule("axios");
jest.mock("axios", () => mockAxios);
mockAxios.create = jest.fn(() => mockAxios); // session.js has internal axios.create instance. overriding it with mockAxios will allow us to mock it

require("dotenv").config({ path: ".env" });
const session = require("./session.js");
const { RefreshTokenExpired, UserUnauthorized } = require("./errortypes.js");
const { MongoClient } = require("mongodb");
let mongocollection = null;



// need to figure out how to mock the axios instance, so all requests to the instance get mocked instead
beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    let db = await connection.db();
    mongocollection = await db.collection(process.env.MONGO_DB_COLLECTION);
});


test("Running buildSession() should return a new session object", () => {
    let one = session.buildSession();
    let two = session.buildSession();
    expect(one).not.toBe(two);
});

test("validateSession() returns RefreshTokenExpired error if bungie api rejects refresh token.", async () => {
    let mocksession = session.buildSession({
        cookie: { maxAge: 1000 }
    });
    mocksession.authData = {
        access_token: 1239078735421,
        token_type: "access",
        expires_in: -1000,
        refresh_token: 12903958032,
        refresh_expires_in: -1000
    };
    expect(() => session.validateSession(mocksession)).rejects.toBeInstanceOf(RefreshTokenExpired);
});

test("validateSession() returns UserUnauthorized if user session is unauthorized and does not contain a query code.", () => {
    let mocksession = session.buildSession();
    mocksession.isLoggedIn = false;
    expect(session.validateSession(mocksession)).rejects.toBeInstanceOf(UserUnauthorized);
});

// TODO: Figure out how to mock axios instance
test("validateSession() should check for access token on requests and refresh them from bungie api if expired.", async ()=> {
    mockAxios.request.mockImplementationOnce(() => {
        return Promise.resolve({
            status: 200,
            statusText: "OK",
            headers: {
                "content-type": "application/json"
            },
            data: {
                access_token: 1239078735421,
                token_type: "access",
                expires_in: 42069,
                refresh_token: 12903958032,
                refresh_expires_in: 22305
            }
        });
    });
    let mocksession = session.buildSession({
        cookie: { maxAge: 1000 }
    });
    mocksession.isLoggedIn = true;
    mocksession.authData = {
        access_token: 234578652,
        token_type: "access",
        expires_in: -10000,
        refresh_token: 21654326586758,
        refresh_expires_in: 10000
    };
    let result = await session.validateSession(mocksession);
    expect(result).toEqual(true);
    expect(mocksession.accessToken).toEqual(1239078735421);
    expect(mocksession._authdata.refresh_token).toEqual(12903958032);
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    
})