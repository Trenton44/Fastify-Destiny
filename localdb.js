const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = (port) => MongoMemoryServer.create({
    instance: {
        port: port ? port : 3002,
        ip: process.env.HOST,
        dbName: process.env.MONGO_DB_NAME,
    }
});