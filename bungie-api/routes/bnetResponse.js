module.exports = {
    method: "GET",
    url: "/bnetResponse",
    schema: {
        "$ref": "/input/GetProfile#" 
    },
    handler: GET
};

function GET(request, reply){
    let valid = request.session.user._state === decodeURIComponent(request.query.state);
    if(!valid){
        request.session.destroy();
        return reply.code(400).send({ error: "Invalid state parameter, user must re-authenticate." });
    }
    request.session.user._querycode = request.query.code;
    return reply.code(303).redirect(process.env.ORIGIN);
}