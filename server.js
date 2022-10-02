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
        transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
    },
    production: {

    },
    testing: {

    }
}

//Initialize fastify and require https connection
const server_app = fastify({
    logger: logger[process.env.NODE_ENV] ?? true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
}); 

const cookie = {
    development: {
        secret: process.env.SESSION_SECRET,
        cookieName: "vexgate-dev",
        //cookiePrefix: "s:", //for compatibility with express-session
        saveUninitialized: true,
        cookie: {
            path: "/",
            maxAge: 3600000, //1 Hour in milliseconds
            httpOnly: true,
            secure: true,
            sameSite: "strict",
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

server_app.register(fastifyCookie);
server_app.register(fastifySession, cookie[process.env.NODE_ENV]);

if(process.env.NODE_ENV == "production"){
    server_app.register(cors, {
        origin: "https://trenton44.github.io",
        methods: ["GET"],
        //credentials: true, //may remove
        strictPreflight: true,
      });
}

//serve front-end on development instance, in production these will be seperated concerns
if(process.env.NODE_ENV == "development"){
    const compiled_front_end = path.join(__dirname, '..', '/frontend/Fastify-Destiny/build/');
    server_app.register(require('@fastify/static'), { root: compiled_front_end, prefix: '/assets/' });
    server_app.get('/*', async (request, reply) => { return reply.sendFile("index.html"); })
}
//register all endpoints with this instance of fastify.
server_app.register(endpoints.api_auth);
server_app.register(endpoints.api_noauth);

//Start server
server_app.listen(
    { port: process.env.PORT_NUMBER, host: "0.0.0.0" },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);