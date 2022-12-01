const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

const sessionStore = require("./session/store.js");
const sessionOptions = require("./session/settings.js")(sessionStore);
const SessionClass = require("./session/UserSession.js");

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
    fastify.addHook("onRequest", async (request, reply) => {
        request.BClient = axiosBungie();
        request.session.data = new SessionClass(request.session.data);
    });
    registerEndpoints(fastify);
    next();
};