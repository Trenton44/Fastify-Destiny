import {jest} from "@jest/globals";

import { default as axios } from "axios";
import apirequest from "../api_request.js";
import { UserUnauthorized, RefreshTokenExpired } from "../errors";
import UserSession from "./UserSession.js";
// by default, reject any attempts at a request, to prevent unwanted network requests.

axios.request = jest.fn(() => Promise.reject("you shouldn't be making any requests here."));

import { UserExists, updateTokens, LoginInitiated, setDefaultProfile } from "./auth.js";
// convert all of these to jest.fn(), with original function as default, so i can change their implementation per test.
describe("These tests verify the functionality of UserExists().", () => {
    let mockRequest = null;
    beforeEach(() => {
        mockRequest = {
            BClient: apirequest,
            session: { 
                data: new UserSession({
                    _authdata: { access_token: "09357092343" },
                    _user: {
                        language: "en",
                        membershipId: "12958273",
                        active: "12345",
                        profiles: {
                            "12345": {
                                destinyMembershipId: "1563",
                                name: "beans"
                            }
                        }
                    }
                }) 
            }
        };
    })
    test("Returns true if an active user profile exists.", 
        () => expect(UserExists(mockRequest)).resolves.toEqual(true)
    );
    
    test("If no active profile exists, but user does have a profile, UserExists() calls setDefaultProfile().", () => {
        expect(true).toEqual(false);
    });
    
    test("If user has no profiles, UserExists() makes a request to the Bungie API.", async () => {
        mockRequest.session.data.data._user.active = null;
        mockRequest.session.data.data._user.profiles = {};
        let mockAPIRequest = {
            primaryMembershipId: "0192957",
            destinyMemberships: {
                "0192957": {
                    "name": "beans",
                    "id": "20934912"
                }
            }
        };
        apirequest.mockImplementationOnce(async () => Promise.resolve(mockAPIRequest));
        let result = await UserExists(mockRequest);
        expect(result).toEqual(true);
        expect(apirequest).toHaveBeenCalledTimes(1);
        expect(mockRequest.session.data.data._user.active).toEqual(mockAPIRequest.primaryMembershipId);
        expect(mockRequest.session.data.activeProfile).toEqual(mockAPIRequest.destinyMemberships[mockAPIRequest.primaryMembershipId]);
        expect(mockRequest.session.data.userProfiles).toEqual(mockAPIRequest.destinyMemberships);
    });

    afterEach(() => jest.clearAllMocks());
});


describe("These tests verify the functionality of updateTokens().", () => {
    let mockSession = null;
    let mockTokenResponse = () => {
        return {
            access_token: "12093753",
            token_type: "access",
            expires_in: 10000,
            refresh_token: "129839579203",
            refresh_expires_in: 10000
        };
    };
    beforeEach(() => mockSession = new UserSession());

    test("updateTokens() checks if accessToken has expired.", async () => {
        let temp = mockTokenResponse();
        mockSession.authData = temp;
        let result = await updateTokens(mockSession);
        expect(result).toEqual(true);
        expect(axios.request).toHaveBeenCalledTimes(0);
    });
    
    test("if access token is expired, updateTokens() checks if refresh token has expired.", async () => {
        let temp = mockTokenResponse();
        temp.expires_in = -10000;
        temp.refresh_expires_in = -10000;
        mockSession.authData = temp;
        expect(updateTokens(mockSession)).rejects.toThrow(RefreshTokenExpired);
        expect(axios.request).toHaveBeenCalledTimes(0);
    });
    
    test("if access token has expired, but refresh token is valid, updateTokens() returns an axios request.", async () => {
        let mockAuthData = mockTokenResponse();
        axios.request.mockImplementationOnce(() => Promise.resolve({ data: mockAuthData }));
        let temp = mockTokenResponse();
        temp.expires_in = -1000;
        mockSession.authData = temp;
        await updateTokens(mockSession);
        expect(axios.request).toHaveBeenCalledTimes(1);
        expect(mockSession.data._authdata.access_token).toEqual(mockAuthData.access_token);
        expect(mockSession.data._authdata.token_type).toEqual(mockAuthData.token_type);
        expect(mockSession.data._authdata.refresh_token).toEqual(mockAuthData.refresh_token);
    });

    afterEach(() => jest.clearAllMocks());
});

describe("These tests verify the functionality of LoginInitiated().", () => {
    const mockAuthData = () => {
        return {
            access_token: "12093753",
            token_type: "access",
            access_expires: 1000,
            refresh_token: "129839579203",
            refresh_expires: 1000
        };
    };

    let mockSession = null;
    beforeEach(() => mockSession = new UserSession());

    test("LoginInitiated() returns true if user is logged in.", async () => {
        mockSession.authData = mockAuthData();
        expect(mockSession.isLoggedIn).toEqual(true);
        let result = await LoginInitiated(mockSession);
        expect(result).toEqual(true);
        expect(axios.request).toHaveBeenCalledTimes(0);
    });

    test("If session is unauthorized and has no query code, LoginInitiated() return UserUnauthorized error.", 
        () => expect(LoginInitiated(mockSession)).rejects.toThrow(UserUnauthorized)
    );

    test("If unauthorized session has a querycode, LoginInitiated() return an Axios request.", async () => {
        let tempMock = mockAuthData();
        axios.request.mockImplementationOnce(() => Promise.resolve({ data: tempMock }));
        mockSession.data._querycode = "2039475";
        let result = await LoginInitiated(mockSession);
        expect(result).toEqual(true);
        expect(mockSession.data._authdata.access_token).toEqual(tempMock.access_token);
        expect(mockSession.data._authdata.token_type).toEqual(tempMock.token_type);
        expect(mockSession.data._authdata.refresh_token).toEqual(tempMock.refresh_token);
    });

    afterEach(() => jest.clearAllMocks());
});

test("setDefaultProfile() correctly sets the active profile to the first profile stored in session.", () => {
    let mockSession = new UserSession();
    mockSession.data._user.profiles = {
        "129052": {
            "name": "Gregory",
            "destinyMembershipId": "129052"
        },
        "030962": {
            "name": "Barney",
            "destinyMembershipId": "030962"
        }
    };
    expect(setDefaultProfile(mockSession)).toEqual(true);
    expect(mockSession.data._user.active).toEqual("129052");
    expect(mockSession.activeProfile).toEqual({
        "name": "Gregory",
        "destinyMembershipId": "129052"
    });
});