const session = require("./session.js");
test("session.js should always return a new object instance", 
    () => expect(session()).not.toBe(session())
);
test("Session language should default to 'en'",
    () => expect(session()._user.language).toEqual("en")
);
test("altering session._authdata with new data should update the session cookie's maxAge to reflect new refresh token expiration.", () => {
    let sessionobj = {
        cookie: {
            maxAge: 3000
        },
    };
    let mocksession = session(sessionobj);
    sessionobj.user = mocksession;
    
    mocksession.authData = {
        access_token: 12345,
        token_type: "access",
        expires_in: 10000,
        refresh_token: 12467,
        refresh_expires_in: 124567
    };
    expect(sessionobj.cookie.maxAge).toEqual(mocksession._authdata.refresh_expires);
});