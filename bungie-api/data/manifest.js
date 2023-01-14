import { MongoMemoryServer } from "mongodb-memory-server";
import { DB_INSTANCE_OPTIONS, DB_NAME } from "./mongodb_manifest.js";
import { MongoClient } from "mongodb";
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Start and connect to manifest db
const mongoServer = await MongoMemoryServer.create(DB_INSTANCE_OPTIONS);
const mongoURI = mongoServer.getUri();
const mongoDB = await MongoClient.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then( conn => conn.db(DB_NAME));
await mongoDB.command({ ping: 1 });

export default async function loadData(keys, language="en"){
    // make a connection to manifest matching user's language
    let collection = await mongoDB.collection(language);
    let results = await collection.find({
        _id: { $regex: keys }
    }).toArray();
    console.log(results);
    await sleep(5000);
    return results;
}