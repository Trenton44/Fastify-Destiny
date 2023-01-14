import { readFile } from "node:fs/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DB_INSTANCE_OPTIONS, DB_NAME } from "./mongodb_manifest.js";
import { MongoClient } from "mongodb";

const __dirname = new URL("./", import.meta.url).pathname;
const readJSONFile = async (path) => JSON.parse(await readFile(path, { encoding: "utf8" }));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Start and connect to manifest db
const mongoServer = await MongoMemoryServer.create(DB_INSTANCE_OPTIONS);
const mongoURI = mongoServer.getUri();
const mongoDB = await MongoClient.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then( conn => conn.db(DB_NAME));
await mongoDB.command({ ping: 1 });

const manifestLanguages = await readJSONFile(__dirname+"languages.json")
const manifests = {};
for(let lang in manifestLanguages){
    if(!manifestLanguages[lang])
        continue;
    manifests[lang] = await mongoDB.collection(lang);
}

export default async function loadData(keys, language="en"){
    // make a connection to manifest matching user's language
    if(!manifests[language])
        return Promise.reject("Invalid manifest language.");
    let results = await manifests[language].find({
        _id: { $regex: keys }
    }).toArray();
    console.log(results);
    return results;
}