const MongoStore = require("connect-mongo");
const { MongoClient } = require("mongodb");

const mongoConnection = MongoClient.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

module.exports = MongoStore.create({
    client: mongoConnection,
    dbName: process.env.MONGO_DB_NAME,
    collectionName: process.env.MONGO_DB_COLLECTION,
    stringify: false,
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