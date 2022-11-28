module.exports = {
    ...jest.requireActual("../session_settings.js"),
    idGenerator: jest.fn((request) => global.sessionID(process.env.JEST_WORKER_ID)),
    cookie: {
        path: "/",
        maxAge: 3600000,
        secure: false,
    },
    store: require("connect-mongo").create({
        mongoUrl: process.env.MONGO_DB_URL,
        dbName: process.env.MONGO_DB_NAME,
        collectionName: process.env.MONGO_DB_COLLECTION,
        stringify: false,
    })
};