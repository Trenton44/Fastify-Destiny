require("dotenv").config({ path: ".env-test" });
const { MongoClient } = require("mongodb");

global.connectDatabase = async (connectionString) => {
    let connection = await MongoClient.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    db = await connection.db(process.env.MONGO_DB_NAME);
    collection = await db.collection(process.env.MONGO_DB_COLLECTION);
    return {
        client: connection,
        db: db,
        collection: collection
    };
}
global.buildServer = () => {
    let app = require("fastify")();
    app.register(require("./bungie-api/fastify_plugin.js"));
    return app;
}