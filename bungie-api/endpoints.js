import CheckSessionAuthorized from "./session/auth.js";

import login from "./routes/login.js";
import BnetResponse from "./routes/bnetResponse.js";
import root from "./routes/root.js";
import UserProfiles from "./routes/UserProfiles.js";
import GetProfile from "./routes/GetProfile.js";

function GeneralRoutes(fastify, options, next){
    fastify.get("/*", (request, reply) => reply.code(404).send({ error: "Endpoint not found." }));
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

export default function(fastify) {
    fastify.register(GeneralRoutes);
    fastify.register(AuthorizedRoutes);
};