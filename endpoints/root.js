const validate = require("./session.js");
module.exports = (fastify, options, next) => {
    fastify.get("/", ServiceStatus);
    fastify.get("/*", (request, reply) => reply.code(404).send({ error: "endpoint unavailable." }));
    next();
};

async function ServiceStatus(request, reply) {
    return validate(request.session)
    .then( (id) => reply.code(200).send({
        available: true,
        bungie_service: true,
        validated: id,

    }))
    .catch( (error) => reply.code(400).send({
        available: true,
        bungie_service: true, //add logic in bungieErrorResponse to check for this, and have it change here when the Bungie API is not available.
        validated: false,
    }));
}