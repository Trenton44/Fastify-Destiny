
/**
 * @module Endpoints 
*/
const authOsession = require("./AuthO/validate.js");
const Login = require("./AuthO/endpoint.js");
const Root = require("./Root/endpoint.js");
const GetProfile = require("./GetProfile/endpoint.js");
const GetCharacter = require("./GetCharacter/endpoint.js");
const GetItem = require("./GetItem/endpoint.js");

//all /api endpoints that do not require authorization with bungie.

let api_noauth = (fastify, options, next) => {
    //nothing necessary in the prehandler atm, but I'm keeping it for consistency with authorized endpoints
    fastify.addHook('preHandler', async function(request, reply){ return true; });
    //these two /api endpoints are for authorizing with the bungie api, and processing the response from bungie
    fastify.register(Login)
    fastify.register(Root); //use the root as a health check, and to set cookies on first access

    next();
};

// Contains all endpoints that require bungie api authorization to access
// prehandler at start verifies that autorization is granted, returns error otherwise.
// These endpoints should only be used by fronted to obtain data, not load webpages.
let api_auth = (fastify, options, next) => {
    //returns error if validation fails.
    fastify.addHook('preHandler', async(request, reply) => {
        return authOsession(request.session)
        .catch( (error) => { return reply.code(400).send({ error: error })});
    });
    //endpoints accessible to appliation
    fastify.register(GetProfile);
    //fastify.register(GetCharacter);
    //fastify.register(GetItem);
    
    next();
}


module.exports = {api_noauth, api_auth};