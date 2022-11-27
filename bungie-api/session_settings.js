const sessionStore = require("./session_store.js");

const options = {
    secret: process.env.SESSION_STORE_SECRET,
    cookieName: process.env.COOKIE_NAME,
    saveUninitialized: true,
    cookie: {
        path: "/",
        maxAge: 3600000, //1 Hour in milliseconds
        httpOnly: true,
        secure: true,
        sameSite: "None",
    },
    store: sessionStore
};

module.exports = options;