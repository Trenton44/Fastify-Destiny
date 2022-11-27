const CheckSessionAuthorized = require("./session_auth.js");

const login = require("./routes/login.js");
const BnetResponse = require("./routes/bnetResponse.js");
const root = require("./routes/root.js");
const UserProfiles = require("./routes/UserProfiles.js");
const GetProfile = require("./routes/GetProfile.js");

function GeneralRoutes(fastify, options, next){
    fastify.all("/*", (request, reply) => reply.code(404).send({ error: "Endpoint not found." }));
    fastify.route(login);
    fastify.route(BnetResponse);
    next();
};

function AuthorizedRoutes(fastify, options, next) {
    fastify.addHook("preHandler", CheckSessionAuthorized);
    fastify.route(root);
    fastify.route(UserProfiles.get);
    fastify.route(UserProfiles.post);
    fastify.route(GetProfile);
    next();
};

module.exports = (fastify) => {
    fastify.register(GeneralRoutes);
    fastify.register(AuthorizedRoutes);
}