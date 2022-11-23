let mockAxios = jest.createMockFromModule("axios");
jest.mock("axios", () => mockAxios);
mockAxios.create = jest.fn(() => mockAxios); // session.js has internal axios.create instance. overriding it with mockAxios will allow us to mock it

const session = require("./session.js");
const { RefreshTokenExpired, UserUnauthorized } = require("./errortypes.js");
const { MongoClient } = require("mongodb");
let mongocollection = null;

function mockUserData() {
    return {
        language: "en",
        membershipId: 213098549320,
        active: 1209835432,
        profiles: {
            "1209835432": {
                membershipId: "1209835432"
            }
        }
    };
}
function mockAuthData(){
    return {
        access_token: 12934075490328762,
        token_type: "Bearer",
        expires_in: 10000,
        refresh_token: 1029573930,
        refresh_expires_in: 10000,
        membership_id: 1902890850
    };
}

describe("These tests validate the buildSession() functionality", () => {
    const { buildSession } = require("./session.js");
    const buildSessionMock = () => {
        let temp = buildSession({
            cookie: { maxAge: 20000 }
        });
        temp._user = mockUserData();
        temp.authData = mockAuthData();
    };
    test("Running buildSession() should return a new session object", 
        () => expect(buildSession()).not.toBe(buildSession())
    );
    test("Session language should default to 'en'",
        () => expect(buildSession()._user.language).toEqual("en")
    );
});
// need to figure out how to mock the axios instance, so all requests to the instance get mocked instead
beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    let db = await connection.db();
    mongocollection = await db.collection(process.env.MONGO_DB_COLLECTION);
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