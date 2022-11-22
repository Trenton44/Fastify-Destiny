const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv");

module.exports = MongoMemoryServer.create({
    instance: {
        port: 3002,
        ip: process.env.HOST,
        dbName: process.env.MONGO_DB_NAME,
    }
});