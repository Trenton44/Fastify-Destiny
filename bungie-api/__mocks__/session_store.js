const MongoStore = require("connect-mongo");

module.exports = new MongoStore({
    client: globalThis.__MONGOCONNECT__,
    dbName: process.env.MONGO_DB_NAME,
    collectionName: process.env.MONGO_DB_COLLECTION,
    stringify: false,
});