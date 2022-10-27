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
const D2Plugin = require("./bungie-api/server-plugin.js");
var trustProxy = false;
var logger = true;
var cookiestore = false;

/*if set to production mode, do the following:
    -enable trustProxy, behind ALB
    -parse the env variables stored as a JSON object into seperate variables
    -Write the cert keys to files
    -Setup the session store to encrypted MongoDB connection
*/
if(process.env.NODE_ENV == "production"){
    trustProxy = true;
    let vars = JSON.parse(process.env.API_KEYS);
    for(property in vars){ process.env[property] = vars[property]; }
    delete process.env.API_KEYS;

    fs.writeFileSync(process.env.HTTPS_KEY_PATH, process.env.PRIVATE_KEY);
    fs.writeFileSync(process.env.HTTPS_CERT_PATH, process.env.PUBLIC_CERT);
    delete process.env.PRIVATE_KEY;
    delete process.env.PUBLIC_CERT;

    cookiestore = mongo_store.create({
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
/*
    -For development mode, just make the logging nicer.
*/
else{
    logger = {
        transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
        },
    };
}

//  Create the server instance
const server_app = fastify({
    logger: logger,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
    trustProxy: trustProxy
}); 

//  Set cookie options.
const cookie = {
    secret: process.env.SESSION_STORE_SECRET,
    cookieName: process.env.COOKIE_NAME,
    saveUninitialized: true,
    cookie: {
        path: "/",
        maxAge: 3600000, //1 Hour in milliseconds
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
    },
};
/*  If ORIGIN env variable exists, the server will do the following
    -Enable CORS, for the origin set in the ORIGIN env variable
    -set cookie sameSite attribute to None (attribute "secure" is true always.)
*/
if(process.env.ORIGIN){ cookie.cookie.sameSite = "None"; }
if(cookiestore){ cookie.store = cookiestore; }

//Register the cookie and session with the server
server_app.register(fastifyCookie);
server_app.register(fastifySession, cookie);

//Register CORS plugin
if(process.env.ORIGIN){
    server_app.register(cors, {
        origin: process.env.ORIGIN,
        methods: ["GET"],
        credentials: true,
        strictPreflight: true,
    });
}

//  register the d2 api and the data map as plugins
//  both functions will be available on the request object.
server_app.register(D2Plugin);

//register all endpoints with this instance of fastify.
server_app.register(endpoints.api_auth);
server_app.register(endpoints.api_noauth);

//Start server
server_app.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);