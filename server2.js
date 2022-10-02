//Built-in libraries
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env" });

//External libraries
const fastify = require("fastify");
const fastifySession = require("@fastify/session");
const fastifyCookie = require("@fastify/cookie");
const mongo_store = require("connect-mongo");
const express_session = require("express-session"); //connect-mongo requires this to be installed, but it is unused
const cors = require("@fastify/cors");
//External functions
const endpoints = require("./server_endpoints.js");

const logger = {
    development: {

    },
    production: {

    },
    testing: {

    }
}

//Initialize fastify and require https connection
const server_app = fastify({
    logger: loggerEnv[process.env.ENVIORNMENT] ?? true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
}); 

const cookie = {
    development: {
        cookieName: "vexgate-dev",
        //cookiePrefix: "s:", //for compatibility with express-session
        saveUninitialized: true,
        cookie: {
            path: "/",
            maxAge: 3600000, //1 Hour in milliseconds
            httpOnly: true,
            secure: true,
            sameSite: "None",
            //domain: "https://trenton44.github.io/Fastify-Destiny/",
        },
    },
    production: {
        secret: process.env.SESSION_SECRET,
        cookieName: "vexgate-prod",
        //cookiePrefix: "s:", //for compatibility with express-session
        saveUninitialized: true,
        cookie: {
            path: "/",
            maxAge: 3600000, //1 Hour in milliseconds
            httpOnly: true,
            secure: true,
            sameSite: "None",
            //domain: "https://trenton44.github.io/Fastify-Destiny/",
        },
        store: mongo_store.create({
            mongoUrl: process.env.MONGO_DB_URL,
            dbName: process.env.MONGO_DB_NAME,
            collectionName: process.env.MONGO_DB_COLLECTION,
            stringify: false,
            mongoOptions: {
            //sslKey: process.env.SESSION_STORE_CERT,
            //sslCert: process.env.SESSION_STORE_CERT,
            },
            //crypto: { secret: process.env.SESSION_STORE_SECRET }
        }),
    },
    testing: {

    }
};

if(process.env.NODE_ENV == "production"){
    server_app.register(cors, {
        origin: "https://trenton44.github.io",
        methods: ["GET"],
        //credentials: true, //may remove
        strictPreflight: true,
      });
}

//register all endpoints with this instance of fastify.
server_app.register(endpoints.api_auth);
server_app.register(endpoints.api_noauth);

//Start server
server_app.listen(
    { port: process.env.PORT_NUMBER, host: "0.0.0.0" },
    function (error, address) { if (error) { process.exit(1); } }
);