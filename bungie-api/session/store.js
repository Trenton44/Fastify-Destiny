import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import UserSession from "./UserSession.js";

if(!process.env.MONGO_DB_URL && process.env.NODE_ENV == "development"){
    console.warn("Warning: No MONGO_DB_URL env variable detected. creating a local MongoDB instance and assigning it to MONGO_DB_URL. This should no be used in a production enviornment.");
    await import("../../mongodb_memory_server.js");
}
    

const mongoConnection = await MongoClient.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const store = MongoStore.create({
    client: mongoConnection,
    dbName: process.env.MONGO_DB_NAME,
    collectionName: process.env.MONGO_DB_COLLECTION,
    stringify: false,
    serialize: (session) => { 
        session.data = session.data.toJSON();
        return session;
    },
    unserialize: (session) => { 
        session.data = new UserSession(session.data); 
        return session;
    },
    mongoOptions: {
        ssl: true,
        sslCert: process.env.HTTPS_CERT_PATH,
        sslKey: process.env.HTTPS_KEY_PATH
    },
    crypto: {
        secret: process.env.SESSION_STORE_SECRET,
        algorithm: process.env.ENCRYPTION_ALG,
        hashing: process.env.ENCRYPTION_HASH,
        encodeas: process.env.ENCRYPTION_ENCODER,
        key_size: process.env.CRYPTO_KEY_SIZE,
        iv_size: process.env.CRYTPO_IV_SIZE,
        at_size: process.env.CRYPTO_AT_SIZE
    }
});

export default store;