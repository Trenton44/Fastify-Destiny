require("dotenv").config({ path: ".env.test" });
const { MongoClient } = require("mongodb");

async function connectDatabase(){
    let connection = await MongoClient.connect(process.env.MONGO_DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    let db = await connection.db();
    return db;
}
async function closeDatabase(db){
    await db.close();
    return true;
}

function buildServer(){
    const opts = require("./settings.js")(process.env.NODE_ENV);
    return require("./app.js")(opts);
}

module.exports = { connectDatabase, closeDatabase };