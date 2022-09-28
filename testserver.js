const fs = require('fs')
const path = require ('path');
require('dotenv').config({path: '.env'});

const fastify = require('fastify')
const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');
const data = require("./bungie_api/profileData.json");

const data_processor = require(path.join(__dirname, '..', '/fastify_backend/bungie_api/dataMap.js'));

const loggerEnv = {
    development: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
            }
        }
    },
    production: true,
    test: false
}

const server_app = fastify({
    logger: loggerEnv[process.env.ENVIORNMENT] ?? true,
});

server_app.register(fastifyCookie);

server_app.register(fastifySession,{
    secret: process.env.SESSION_SECRET,
    cookieName: "d2_api",
    cookiePrefix: "s:", //for compatibility with express-session
    saveUninitialized: true,
    cookie: {
        path: "/",
        maxAge: 3600000, //1 Hour in milliseconds
        httpOnly: false,
        secure: false,
    },
});

server_app.get("/*", async(request, reply) => {
    return "Hello World!";
});
server_app.get('/api/characterData', async (request, reply) => {
    let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/Character/{characterId}/";
    let request_type = "get";
    let code = "200";
    let result = data_processor(api_doc_link, request_type, code, data);
    console.log(result);
    return reply.send(result);
}); 
server_app.get('/api/characterIds', async (request, reply) => {
    return reply.send(["2134", "52", "3257"]);
});
server_app.listen(3002, function(error, address){
    if(error)
        process.exit(1);
});