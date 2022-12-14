import cookie from "@fastify/cookie";
import session from "@fastify/session";

import sessionOptions from "./session/settings.js";

import registerEndpoints from "./endpoints.js";
//const schemaLoader = require("./schemas");
import axiosBungie from "./api_request.js";
import UserSession from "./session/UserSession.js";
import DataMap from "./utils/map.js";

export default function (fastify, options, next) {
    fastify.register(cookie); // register cookie to be used with bungie api session
    fastify.register(session, sessionOptions); // register session storage for bungie api.
    fastify.decorateRequest("BClient", null); // Add a utility function for making requests to the api
    fastify.decorateRequest("BMap", DataMap);
    fastify.addHook("onRequest", async (request, reply) => {
        if(!request.session.data)
            request.session.data = new UserSession();
        request.BClient = axiosBungie();
    });
    registerEndpoints(fastify);
    next();
};