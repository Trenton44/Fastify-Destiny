const { validateSession } = require("./session");

let general = (fastify, options, next) => {
    next();
};


let user = (fastify, options, next) => {
    fastify.addHook('preHandler', async (request, reply) => {
        await validateSession(request.session).catch( (error) => reply.code(400).send({ error: "User has not authorized this app." }));
        request.BClient.headers.Authorization = "Bearer "+request.session.accessToken;
        return true;
    });
    fastify.get("/GetProfile", { schema: {} }, async (request, reply) => {
        const openapiurl = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        //let url = InjectURLParameters();

        await request.BClient();
    });
    next();
};



module.exports = (fastify, options, next) => {
    fastify.register(general);
    fastify.register(user);
    next();
};