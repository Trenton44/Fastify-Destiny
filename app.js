
/**
 * @module Server
 */
const fastify = require('fastify');

const cors = require("@fastify/cors");

const Bungie = require("./bungie-api/plugin.js");

/**
 * Builds the fastify server, using provided options
 * @param { Object } opts : The options for the fastify server object
 * @param { Object } cookieopts : options for the server's session cookie.
 * @param { Object } corsopts : CORS options. if passed, sets session cookie SameSite attribute to "None"
 * @returns { fastify }
 */
function build(opts){
    const app = fastify(opts); // initialize the fastify instance
    app.register(cors, EnableCrossOrigin()); // registers @fastify/cors
    app.register(Bungie); // registers the D2API functions into the server
    return app; 
}

function EnableCrossOrigin(){
    if(!process.env.ORIGIN)
        throw Error("Missing ORIGIN env variable.");
    return {
        origin: process.env.ORIGIN,
        methods: ["GET"],
        credentials: true,
        strictPreflight: true,
    };
}
module.exports = build;