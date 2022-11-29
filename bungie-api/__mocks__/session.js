
module.exports = jest.fn((store) => {
    return {
        secret: process.env.SESSION_STORE_SECRET,
        cookieName: process.env.COOKIE_NAME,
        saveUninitialized: true,
        idGenerator: (request) => global.sessionID,
        cookie: {
            path: "/",
            domain: "127.0.0.1",
            maxAge: 3600000,
            secure: false,
            httpOnly: false
        },
        store: store
    }
});
module.exports.template = jest.requireActual("../session.js").template;