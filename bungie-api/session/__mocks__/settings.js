import sessionStore from "./store.js";

const settings = {
    secret: process.env.SESSION_STORE_SECRET,
    cookieName: process.env.COOKIE_NAME,
    saveUninitialized: true,
    idGenerator: (request) => global.sessionID,
    cookie: {
        path: "/",
        maxAge: 3600000,
        secure: false,
        httpOnly: false,
        sameSite: "Lax"
    },
    store: sessionStore
};
export default settings;