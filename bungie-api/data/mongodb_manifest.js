import { MongoMemoryServer } from "mongodb-memory-server";

/*
    This server is NOT ephemeral, and data WILL persist after program exit.
*/
const server = await MongoMemoryServer.create({
    instance: {
        storageEngine: "wiredTiger",
        dbPath: "./manifestDb",
        dbName: "ManifestDB"
    }
});

export const close = () => server.stop();
export const URI = server.getUri();
export default server;