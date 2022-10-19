
const configuration = require("./config");
const schema = require("./schema.json");


async function getprofile(request, reply,){
    return reply.code(200).send("ok!");
}
let GetProfile = (fastify, options, next) => {
    fastify.get("/profile", { schema: schema }, getprofile);
    next();
}


module.exports = GetProfile;