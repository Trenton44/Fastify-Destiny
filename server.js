//Built-in libraries
const fs = require("fs");
require("dotenv").config({ path: ".env" });


const fastify = require("fastify");
const fastifySession = require("@fastify/session");
const fastifyCookie = require("@fastify/cookie");
const mongo_store = require("connect-mongo");
const express_session = require("express-session"); //connect-mongo requires this to be installed, but it is unused
const cors = require("@fastify/cors");
//External functions
const endpoints = require("./endpoints/endpoints.js"); // ...  @module

if(process.env.NODE_ENV == "production"){
    let vars = JSON.parse(process.env.API_KEYS);
    for(property in vars){ process.env[property] = vars[property]; }
    delete process.env.API_KEYS;

    console.log("Saving SSL cert to files");
    fs.writeFileSync(process.env.HTTPS_KEY_PATH, process.env.PRIVATE_KEY);
    fs.writeFileSync(process.env.HTTPS_CERT_PATH, process.env.PUBLIC_CERT);
    delete process.env.PRIVATE_KEY;
    delete process.env.PUBLIC_CERT;
}

let trustProxy = function(){
    if(process.env.NODE_ENV == "production")
        return true;
    return false;
}

let logger = function(){
    if(process.env.NODE_ENV == "development"){
        return {
            transport: {
                target: "pino-pretty",
                options: {
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
            },
        }
    }
    else{ return true; }
}
const server_app = fastify({
    logger: logger(),
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
    trustProxy: trustProxy()
}); 

const cookie = {
    secret: process.env.SESSION_STORE_SECRET,
    cookieName: process.env.COOKIE_NAME,
    saveUninitialized: true,
    cookie: {
        path: "/",
        maxAge: 3600000, //1 Hour in milliseconds
        httpOnly: true,
        secure: true,
        sameSite: "None",
    },
};

if(process.env.NODE_ENV == "production"){
    cookie.store = mongo_store.create({
        mongoUrl: process.env.MONGO_DB_URL,
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
}

server_app.register(cors, {
    origin: process.env.ORIGIN,
    methods: ["GET"],
    credentials: true,
    strictPreflight: true,
});


server_app.register(fastifyCookie);
server_app.register(fastifySession, cookie);


//register all endpoints with this instance of fastify.
server_app.register(endpoints.api_auth);
server_app.register(endpoints.api_noauth);

//Start server
server_app.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);