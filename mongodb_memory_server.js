const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = MongoMemoryServer.create({
    instance: {
        ip: process.env.HOST,
        dbName: process.env.MONGO_DB_NAME,
    }
});