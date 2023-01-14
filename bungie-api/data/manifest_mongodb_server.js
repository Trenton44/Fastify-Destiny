import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
let server = await MongoMemoryServer.create({
    instance: {
        storageEngine: "wiredTiger",
        dbPath: "/home/tmc069/VexGate-API/bungie-api/data/manifestDb",
        dbName: "ManifestDB"
    }
});

export async function connect(){
    const uri = server.getUri();
    const connection = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = await connection.db("ManifestDB");
    await db.command({ ping: 1 });
    return db;
};
export default server;