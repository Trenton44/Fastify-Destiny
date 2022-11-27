const { CheckSessionAuthorized, BungieLogin, BungieLoginResponse } = require("./session");
const MapResponse = require("./api.js");

let general = (fastify, options, next) => {
    fastify.get("/*", async (request, reply) => reply.code(404).send({ error: "Endpoint not found." }));
    fastify.get("/login", (request, reply) => {
        let redirect = new URL("https://www.bungie.net/en/OAuth/Authorize");
        let state = require("crypto").randomBytes(16).toString("base64");
        request.session.user._state = state;
        redirect.search = new URLSearchParams({
            client_id: process.env.BUNGIE_CLIENT_ID,
            response_type: "code",
            state: state
        });
        return reply.code(303).redirect(encodeURI(redirect));
    });
    fastify.get("/bnetResponse", (request, reply) => {
        let valid = request.session.user._state === decodeURIComponent(request.query.state);
        if(!valid){
            request.session.destroy();
            return reply.code(400).send({ error: "Invalid state parameter, user must re-authenticate." });
        }
        request.session.user._querycode = request.query.code;
        return reply.code(303).redirect(process.env.ORIGIN);
    });
    next();
};

let user = (fastify, options, next) => {
    fastify.addHook("preHandler", CheckSessionAuthorized);
    fastify.get("/", async (request, reply) => {
        // if user doesn't receive a response, this api is down
        // if user receives a BungieUnavailable error, request failed at preHandler, because bungie is down
        // if user recieves a UserUnauthorized error, request failed at preHandler because user has not logged in
        // if user gets here, both api's are functional, return the active Profile.
        return request.session.user.activeProfile;
    });
    fastify.get("/UserProfiles", async (request, reply) => request.session.user.userProfiles);
    fastify.post("/UserProfiles", async (request, reply) => Error("Endpoint under construction"));
    fastify.get("/GetProfile", { schema: {"$ref": "/input/GetProfile#" } }, async (request, reply) => {
        const openapiuri = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let profile = request.session.user.activeProfile;
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
}