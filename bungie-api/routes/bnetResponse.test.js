/*
    checks returned _state value against _state stored in session.
        if they do not match, destroys session
        if they do not match, returns 400 error
    if _state parameter is validated, request correctly stores query code into user session
    valid request correctly returns a 303 redirect to page stored in ORIGIN env variable
*/

const sleep = ms => new Promise(r => setTimeout(r, ms));
let cookie = {};
const setCookie = (cookies) => {
    cookie = cookies.find(element => element.name == process.env.COOKIE_NAME);
    cookie.expires = cookie.expires.toISOString();
    let temp = "";
    Object.entries(cookie).forEach(([key, value], index) => {
        temp = temp.concat(key+"="+value);
        if(Object.keys(cookie).length - 1 > index)
            temp = temp.concat("; ");
    });
    cookie = temp;
}
beforeEach(async () => {
    //ping an endpoint to create the session and get the cookie
    let result = await global.App.inject({
        authority: "127.0.0.1",
        method: "GET",
        url: "/login"
    });
    setCookie(result.cookies);
});

test("Recieving an invalid _state parameter should destroy the session and return a 400 error.", async () => {
    let invalidstate = "astateparameterthatshouldnotmatch";
    let currentstate = await global.MongoCollection.findOne({ _id: global.sessionID });
    currentstate = currentstate.session.data._state;
    expect(currentstate).not.toEqual(invalidstate);

    let result = await global.App.inject({
        authority: "127.0.0.1",
        method: "GET",
        url: "/bnetResponse",
        query: { state: encodeURIComponent(invalidstate) },
        headers: { Cookie: cookie }
    });
    expect(result.statusCode).toEqual(400);
    let ses = await global.MongoCollection.findOne({ _id: global.sessionID });
    expect(ses).toEqual(null);
});

test("Receiving a valid state parameter should return 303 redirect", async () => {
    let currentstate = await global.MongoCollection.findOne({ _id: global.sessionID });
    console.log(currentstate);
    currentstate = currentstate.session.data._state;
    expect(currentstate).toBeTruthy();
    expect(cookie).toBeTruthy();
    Object.entries(cookie).forEach(([key, value]) => {
        encodeURIComponent(value);
    });
    let result = await global.App.inject({
        authority: "http://127.0.0.1",
        method: "GET",
        url: "/bnetResponse",
        query: { state: encodeURIComponent(currentstate) },
        headers: { Cookie: cookie }
    });
    expect(result.statusCode).toEqual(303);
    expect(result.cookies.length).toEqual(1);
    setCookie(result.cookies);
    
});

//afterEach(async () => await global.MongoCollection.deleteMany({}));