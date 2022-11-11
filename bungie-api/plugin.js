require("dotenv").config({ path: "../.env" });
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const axios = require("axios");

const settings = require("./settings.js")[process.env.NODE_ENV];
const endpoints = require("./endpoints");
const buildSession = require("./session.js").buildSession;

const axiosbase = {
    baseURL: "https://www.bungie.net/Platform",
    headers: {
        "X-API-Key": process.env.BUNGIE_API_KEY,
        "User-Agent": "VexGate API/"+process.env.VERSION+" AppId/"+process.env.BUNGIE_CLIENT_ID
    },
};

module.exports = (fastify, options, next) => {
    fastify.register(cookie); // register cookie to be used with bungie api session
    fastify.register(session, settings); // register session storage for bungie api.
    fastify.decorateRequest("BClient", null); // Add a utility function for making requests to the api
    fastify.addHook("onRequest", (request, reply) => {
        // language var will be how we determine if session is new. if it doesn't exist, this is a new user.
        // stopgap until i find a way to properly detect new session instances
        if(!request.session.language)
            request.session = buildSession(request.session); // if no session already exists for user, create one
        request.BClient = axios.create(axiosbase); // fill utility function with axios instance. (done here to avoid global mutations.)
    });

    fastify.register(endpoints);
    next();
};


