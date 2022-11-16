
require("dotenv").config({ path: "../.env" });
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");

const settings = require("./session-settings.js")(process.env.NODE_ENV);
const endpoints = require("./endpoints");
const schemaLoader = require("./schemas");
const { buildSession } = require("./session.js");
const { buildAPIRequest } = require("./api.js");

module.exports = (fastify, options, next) => {
    for(schema in schemaLoader){
        fastify.addSchema(schemaLoader[schema]);
    }

    fastify.register(cookie); // register cookie to be used with bungie api session
    fastify.register(session, settings); // register session storage for bungie api.
    fastify.decorateRequest("BClient", null); // Add a utility function for making requests to the api
    fastify.decorateRequest("InjectURI", InjectURIParameters);
    fastify.addHook("onRequest", (request, reply) => {
        // language var will be how we determine if session is new. if it doesn't exist, this is a new user.
        // stopgap until i find a way to properly detect new session instances
        if(!request.session.language)
            request.session = buildSession(request.session); // if no session already exists for user, create one
        request.BClient = buildAPIRequest();
    });
    fastify.register(endpoints);
    next();
};


function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}