/**
 * @module Endpoints 
*/

const crypto = require("crypto");

module.exports = (fastify, options, next) => {
    fastify.get("/login", LoginRequest);
    fastify.get("/bnetResponse", LoginResponse);
    next();
};

async function LoginRequest(request, reply) {
    const AuthURL = "https://www.bungie.net/en/OAuth/Authorize";
    let body = {
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: crypto.randomBytes(16).toString("base64")
    };
    request.session.state = request_body.state;
    let redirect = new URL(AuthURL);
    redirect.search = new URLSearchParams(body);
    return reply.code(303).redirect(encodeURI(redirect));
}

async function LoginResponse(request, reply){
    let validresponse = request.session.state === decodeURIComponent(request.query.state);
    if(!validresponse){
        request.session.destroy();
        return reply.code(400).send({ error: "Unable to validate session, user must re-authenticate"})
    }
    request.session.query_code = request.query.code;
    if(process.env.ORIGIN)
        return reply.code(303).redirect(process.env.ORIGIN);
    return reply.code(303).redirect("/");
}