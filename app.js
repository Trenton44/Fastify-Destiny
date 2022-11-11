
/**
 * @module Server
 */
const fastify = require('fastify');
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const cors = require("@fastify/cors");

const endpoints = require("./endpoints/endpoints.js");
const Bungie = require("./bungie-api/plugin.js");

/**
 * Builds the fastify server, using provided options
 * @param { Object } opts : The options for the fastify server object
 * @param { Object } cookieopts : options for the server's session cookie.
 * @param { Object } corsopts : CORS options. if passed, sets session cookie SameSite attribute to "None"
 * @returns { fastify }
 */
function build(opts, corsopts){
    const app = fastify(opts); // initialize the fastify instance
    if(corsopts)
        app.register(cors, corsopts); // registers @fastify/cors
    app.register(Bungie); // registers the D2API functions into the server
    return app; 
}

module.exports = build;