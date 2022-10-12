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

const logger = {
    development: {
        /*transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },*/
    },
    production: {

    },
    testing: {

    }
}


//Initialize fastify and require https connection
let trustProxy = false;
if(process.env.NODE_ENV == "production"){
    trustProxy = true;
    console.log("trustProxy has been set to "+trustProxy);
}
    
const server_app = fastify({
    logger: logger[process.env.NODE_ENV] ?? true,
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
    trustProxy: trustProxy
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
            //domain: "https://trenton44.github.io"
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
            crypto: { secret: process.env.SESSION_STORE_SECRET }
        }),
    },
    testing: {

    }
};

if(process.env.NODE_ENV == "production"){
    server_app.register(cors, {
        origin: "https://trenton44.github.io",
        methods: ["GET"],
        credentials: true, //may remove
        strictPreflight: true,
    });
}


server_app.register(fastifyCookie);
server_app.register(fastifySession, cookie[process.env.NODE_ENV]);


//serve front-end on development instance, in production these will be seperated concerns
if(process.env.NODE_ENV == "development"){
    const compiled_front_end = path.join(__dirname, '..', '/frontend/Fastify-Destiny/build/');
    server_app.register(require('@fastify/static'), { root: compiled_front_end, prefix: '/assets/' });
    server_app.get('/*', async (request, reply) => { return reply.sendFile("index.html"); })
}
else{
    console.log("Setting root to return 200, as a health check.");
    server_app.get('/', async (request, reply) => { return reply.code(200).send({ status: "ok" }); }); //use the root as a health check, and to set cookies on first access
    server_app.get('/*', async (request, reply) => { console.log("unavailable, return 404"); return reply.code(404).send({ error: "endpoint not found" }); }); //Catch-all 404 response
}
//register all endpoints with this instance of fastify.
server_app.register(endpoints.api_auth);
server_app.register(endpoints.api_noauth);

//Start server
server_app.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);