const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

const settings = require("./session_settings.js");
const endpoints = require("./endpoints.js");
const schemaLoader = require("./schemas");
const sessionTemplate = require("./session.js");
const axiosBungie = require("./api_request.js");

module.exports = (fastify, options, next) => {
    for(schema in schemaLoader){
        fastify.addSchema(schemaLoader[schema]);
    }

    fastify.register(cookie); // register cookie to be used with bungie api session
    fastify.register(session, settings); // register session storage for bungie api.
    fastify.decorateRequest("BClient", null); // Add a utility function for making requests to the api
    fastify.decorateRequest("InjectURI", InjectURIParameters);
    fastify.addHook("onRequest", async (request, reply) => {
        // user var will be how we determine if session is new. if it doesn't exist, this is a new user.
        // stopgap until i find a way to properly detect new session instances
        if(!request.session.user)
            request.session.user = sessionTemplate(request.session); // if no session already exists for user, create one
        request.BClient = axiosBungie();
    });
    fastify.register(endpoints);
    next();
};


function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}