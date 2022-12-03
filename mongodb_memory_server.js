//Note: This server is ephemeral, and will destroy itself on server shutdown
import { MongoMemoryServer } from "mongodb-memory-server";
let server = await MongoMemoryServer.create({
    instance: {
        ip: process.env.HOST,
        dbName: process.env.MONGO_DB_NAME,
    }
});
process.env.MONGO_DB_URL = server.getUri();
export default server;