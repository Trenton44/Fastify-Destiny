
/**
 * @module Server
 */
const fastify = require('fastify');
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const cors = require("@fastify/cors");

const endpoints = require("./endpoints/endpoints.js");
const D2Plugin = require("./bungie-api/server-plugin.js");

/**
 * Builds the fastify server, using provided options
 * @param { Object } opts : The options for the fastify server object
 * @param { Object } cookieopts : options for the server's session cookie.
 * @param { Object } corsopts : CORS options. if passed, sets session cookie SameSite attribute to "None"
 * @returns { fastify }
 */
function build(opts={}, cookieopts, corsopts=false){
    const app = fastify(opts); // initialize the fastify instance
    app.register(cookie); // registers @fastify/cookie
    if(corsopts){
        app.register(cors, corsopts); // registers @fastify/cors
        cookieopts.cookie.sameSite = "None"; // sets cookie SameSite attribute to "None" (allow cors to work)
    }
    app.register(session, cookieopts); // registers @fastify/session and passes cookie options
    
    app.register(D2Plugin); // registers the D2API functions into the server
    // register the endpoints for the server.
    app.register(endpoints);
    
    return app; 
}

module.exports = build;