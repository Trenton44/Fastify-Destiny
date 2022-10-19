const path = require ('path');
const authOsession = require(path.join(__dirname, "..", "/AuthO/validate.js"));


async function HealthCheck(request, reply){
    return authOsession(request.session)
    .then( (id) => {
        return reply.code(200).send({
            available: true,
            bungie_service: true,
            validated: id,

        });
    })
    .catch( (error) => {
        return reply.code(200).send({
            available: true,
            bungie_service: true, //add logic in bungieErrorResponse to check for this, and have it change here when the Bungie API is not available.
            validated: false,
        });
    });
}

let Root = (fastify, options, next) => {
    fastify.get("/", HealthCheck);
    fastify.get("/*", (request, reply) => { return reply.code(404).send({ error: "endpoint unavailable." }); });
    next();
}
module.exports = Root;