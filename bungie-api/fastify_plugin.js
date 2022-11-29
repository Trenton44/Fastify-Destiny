const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

const sessionStore = require("./session_store.js");
const sessionOptions = require("./session.js")(sessionStore);
const sessionTemplate = require("./session.js").template;

const registerEndpoints = require("./endpoints.js");
const schemaLoader = require("./schemas");
const axiosBungie = require("./api_request.js");

module.exports = (fastify, options, next) => {
    for(schema in schemaLoader){
        fastify.addSchema(schemaLoader[schema]);
    }

    fastify.register(cookie); // register cookie to be used with bungie api session
    fastify.register(session, sessionOptions); // register session storage for bungie api.
    fastify.decorateRequest("BClient", null); // Add a utility function for making requests to the api
    fastify.decorateRequest("InjectURI", InjectURIParameters);
    fastify.addHook("onRequest", async (request, reply) => {
        // user var will be how we determine if session is new. if it doesn't exist, this is a new user.
        // stopgap until i find a way to properly detect new session instances
        if(!request.session.user)
            request.session.user = sessionTemplate(request.session); // if no session already exists for user, create one
        request.BClient = axiosBungie();
    });
    registerEndpoints(fastify);
    next();
};


function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}