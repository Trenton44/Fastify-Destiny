const MongoStore = require("connect-mongo");
const UserSession = require("../UserSession.js");

module.exports = new MongoStore({
    client: globalThis.__MONGOCONNECT__,
    dbName: process.env.MONGO_DB_NAME,
    collectionName: process.env.MONGO_DB_COLLECTION,
    stringify: false,
    serialize: (session) => { 
        session.data = session.data ? session.data.toJSON() : new UserSession().toJSON();
        console.log(session.data);
        return session;
    },
    unserialize: (session) => {
        console.log(session.data);
        session.data = new UserSession(session.data);
        return session;
    }
    
}); 