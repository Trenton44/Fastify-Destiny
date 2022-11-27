let mockAxios = jest.createMockFromModule("axios");
jest.mock("axios", () => mockAxios);
mockAxios.create = jest.fn(() => mockAxios);

const session = require("./session.js");
const { validateSession } = require("./session_auth.js");
const { RefreshTokenExpired, UserUnauthorized } = require("./errors.js");

test("validateSession() returns a RefreshTokenExpired error if bungie rejects refresh token request", async () => {
    mockAxios.request.mockImplementation(() => Promise.reject("You should not be reaching any axios requests here."));
    let mocksession = session({
        cookie: { maxAge: 1000 }
    });
    mocksession.authData = {
        access_token: 12345,
        token_type: "access",
        expires_in: -1000,
        refresh_token: 12467,
        refresh_expires_in: -1000
    };
    expect(validateSession(mocksession)).rejects.toBeInstanceOf(RefreshTokenExpired);
});

test("Unauthorized users without a querycode in session should be rejected with UserUnauthorized error.", () => {
    let mocksession = session({
        cookie: { maxAge: 1000 }
    });
    expect(validateSession(mocksession)).rejects.toBeInstanceOf(UserUnauthorized);
});

test("validateSession() should check for/renew expired access tokens on every request", async () => {
    mockAxios.request.mockImplementation(() => {
        return Promise.resolve({
            status: 200,
            statusText: "OK",
            headers: { "content-type": "application/json" },
            data: {
                access_token: 124574,
                token_type: "access",
                expires_in: 42069,
                refresh_token: 123643,
                refresh_expires_in: 22305
            }
        });
    });
    let mocksession = session({ cookie: { maxAge: 1000 } });
    mocksession.isLoggedIn = true;
    mocksession.authData = {
        access_token: 234578652,
        token_type: "access",
        expires_in: -10000,
        refresh_token: 21654326586758,
        refresh_expires_in: 10000
    };
    let result = await validateSession(mocksession);
    expect(result).toEqual(true);
    expect(mocksession.accessToken).toEqual(124574);
    expect(mocksession._authdata.refresh_token).toEqual(123643);
    expect(mockAxios.request).toHaveBeenCalledTimes(1);

});