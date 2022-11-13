const { validateSession, BungieLogin, BungieLoginResponse, sessionStatus } = require("./session");
const { InjectURIParameters, ProcessResponse } = require("./api.js");

let general = (fastify, options, next) => {
    fastify.get("/", sessionStatus);
    fastify.get("/*", async (request, reply) => reply.code(404).send({ error: "Endpoint not found." }));
    fastify.get("/login", BungieLogin);
    fastify.get("/bnetResponse", BungieLoginResponse);
    next();
};


let user = (fastify, options, next) => {
    fastify.addHook('preHandler', async (request, reply) => {
        await validateSession(request.session).catch( (error) => reply.code(400).send({ error: "User has not authorized this app." }));
        request.BClient.headers.Authorization = "Bearer "+request.session.accessToken;
        return true;
    });
    fastify.get("/ActiveProfile", async (request, reply) => {
        return request.session.activeProfile;
    });
    /*
    fastify.post("/ActiveProfile", async (request, reply) => {

    });
     */

    /**
     * THE VERY FIRST endpoint your application should call.
     */
    fastify.get("/UserProfiles", async (request, reply) => {
        if(request.session.availableProfileIds.length == 0){ 
            request.log.info("No user profiles exist. fetching them now.");
            const openapiurl = "/User/GetMembershipsById/{membershipId}/{membershipType}/";
            let uri = InjectURIParameters(openapiurl, {
                membershipId: request.session._user.membershipId,
                membershipType: -1
            });
            let response = await request.BClient(uri)
            .then( (resp) => api.ProcessResponse(resp, openapiurl, "ActiveProfile", request.session._user.language))
            .catch( (error) => reply.code(400).send(error));
            request.session._user.profiles = response.destinyMemberships;
            request.session.activeProfile = response.primaryMembershipId ? 
                response.primaryMembershipId : Object.keys(request.session.availableProfileIds)[0];
        }
        return request.session.availableProfiles;
    });

    fastify.get("/GetProfile", { schema: {} }, async (request, reply) => {
        const openapiuri = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let profile = request.session.activeProfile;
        let uri = InjectURIParameters(openapiuri, {
            membershipType: profile.membershipType,
            destinyMembershipId: profile.destinyMembershipId,
        });
        return request.BClient(uri, {
            params: { components: request.query.components }
        })
        .then( (response) => ProcessResponse(response, openapiuri))
        .catch( (error) => reply.code(400).send({ error: "error" }));
    });
    next();
};



module.exports = (fastify, options, next) => {
    fastify.register(general);
    fastify.register(user);
    next();
};