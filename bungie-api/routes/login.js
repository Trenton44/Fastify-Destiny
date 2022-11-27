module.exports = {
    method: "GET",
    url: "/login",
    handler: GET,
};

function GET(request, reply){
    let redirect = new URL("https://www.bungie.net/en/OAuth/Authorize");
    let state = require("crypto").randomBytes(16).toString("base64");
    request.session.user._state = state;
    redirect.search = new URLSearchParams({
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: state
    });
    return reply.code(303).redirect(encodeURI(redirect));
}