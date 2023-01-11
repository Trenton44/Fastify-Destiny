import crypto from "node:crypto";
export default {
    method: "GET",
    url: "/login",
    handler: GET,
};

/**
 * Handler for GET requests to /login endpoint of backend.
 * Initiates authentication flow with bungie.net and redirects user to OAuth 2.0 login flow
 * @param {FastifyRequest} request 
 * @param {FastifyReply} reply 
 * @returns 
 */
async function GET(request, reply){
    let redirect = new URL("https://www.bungie.net/en/OAuth/Authorize");
    request.session.data.data._state = crypto.randomBytes(16).toString("base64");
    redirect.search = new URLSearchParams({
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: request.session.data.data._state
    });
    return reply.code(303).redirect(encodeURI(redirect));
}