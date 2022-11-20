const { validateSession, validateProfiles, BungieLogin, BungieLoginResponse } = require("./session");
const MapResponse = require("./api.js");

let general = (fastify, options, next) => {
    fastify.get("/*", async (request, reply) => reply.code(404).send({ error: "Endpoint not found." }));
    fastify.get("/login", BungieLogin);
    fastify.get("/bnetResponse", BungieLoginResponse);
    next();
};


let user = (fastify, options, next) => {
    fastify.addHook('preHandler', async (request, reply) => {
        return validateSession(request.session)
        .then( (success) =>{
            request.BClient.defaults.headers["Authorization"] = "Bearer "+request.session.accessToken;
            return validateProfiles(request);
        })
        .catch( (error) => reply.code(400).send(error));
    });
    
    fastify.get("/", async (request, reply) => {
        // if user doesn't receive a response, this api is down
        // if user receives a BungieUnavailable error, request failed at preHandler, because bungie is down
        // if user recieves a UserUnauthorized error, request failed at preHandler because user has not logged in
        // if user gets here, both api's are functional, return the active Profile.
        return request.session.activeProfile;
    });
    fastify.get("/UserProfiles", async (request, reply) => {
        return request.session.userProfiles;
    });
    fastify.post("/UserProfiles", async (request, reply) => {
        //code to validate request and update active user here.
    });
    fastify.get("/GetProfile", { schema: {"$ref": "/input/GetProfile#" } }, async (request, reply) => {
        const openapiuri = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let profile = request.session.activeProfile;
        let response = await request.BClient(
            request.InjectURI(openapiuri,{
                membershipType: profile.membershipType,
                destinyMembershipId: profile.destinyMembershipId
            }), 
            { params: { components: request.query.components }}
        ).catch( (error) => console.log(error));
        console.log(response);
    });
    next();
};

module.exports = (fastify, options, next) => {
    fastify.register(general);
    fastify.register(user);
    next();
};