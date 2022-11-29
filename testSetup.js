require("dotenv").config({ path: ".env-test" });
const { MongoClient } = require("mongodb");
module.exports = async function(globalConfig, projectConfig){
    console.log();
    globalThis.__MONGOSERVER__ = await require("./localdb.js")(3003).catch( (error) => Error(error));
    console.log("Mongo Server created successfully.");

    process.env.MONGO_DB_URL = globalThis.__MONGOSERVER__.getUri();
    console.log("MONGO_DB_URL env variable set to server uri.");

    globalThis.__MONGOCONNECT__ = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("Connection to mongo server established.");

    globalThis.__MONGODB__ = await globalThis.__MONGOCONNECT__.db(process.env.MONGO_DB_NAME);
    console.log("Connection to DB "+process.env.MONGO_DB_NAME+" successful.");
    
    return true;
}