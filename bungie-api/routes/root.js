export default {
    method: "GET",
    url: "/",
    handler: GET
};

/**
 * Handler for GET requests to / endpoint of backend.
 * Sucessful requests to this endpoint means the user has been authenticated and the bungie api service is available
 * @param {FastifyRequest} request 
 * @param {FastifyReply} reply 
 * @returns 
 */
function GET(request, reply){
    // if user doesn't receive a response, this api is down
    // if user receives a BungieUnavailable error, request failed at preHandler, because bungie is down
    // if user recieves a UserUnauthorized error, request failed at preHandler because user has not logged in
    // if user gets here, both api's are functional, return the active Profile.
    return reply.code(200).send(request.session.data.activeProfile);
}