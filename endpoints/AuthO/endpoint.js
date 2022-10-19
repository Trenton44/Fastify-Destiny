const path = require ('path');
const crypto = require("crypto");

async function Request(request, reply){
    request.log.warn("HERE");
    let openapi_url = "https://www.bungie.net/en/OAuth/Authorize";
    let request_body = {
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: crypto.randomBytes(16).toString("base64")
    };
    request.session.state = request_body.state;
    let redirect_url = new URL(openapi_url);
    redirect_url.search = new URLSearchParams(request_body);
    return reply.code(303).redirect(encodeURI(redirect_url));
}

async function Response(request, reply){
    if(request.session.state != decodeURIComponent(request.query.state)){
        console.log("States "+request.session.state+" (session) and "+decodeURIComponent(request.query.state)+" (query) did not match! destroying session.");
        request.session.destroy();
        return reply.code(400).send({error: "Unable to validate session, user must re-authenticate."});
    }
    request.session.query_code = request.query.code;
    return reply.code(303).redirect(process.env.FRONTEND_SERVER);
}

let Login = (fastify, options, next) => {
    fastify.get('/login', Request);
    fastify.get('/login_response', Response);
    next();
}


module.exports = Login;