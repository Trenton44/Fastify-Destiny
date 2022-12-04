import MongoStore from "connect-mongo";
import UserSession from "./UserSession.js";


export default new MongoStore({
    client: globalThis.__MONGOCONNECT__,
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
    
}); 