
const configuration = require("./config");
const schema = require("./schema.json");


//The function used to process the receiving data.
//This will ready the necessary data for the Bungie API call, and then pass this to a function inside wrapper.js
async function getprofile(request, reply,){
    return reply.code(200).send({ status: "ok!" });
}

let GetProfile = (fastify, options, next) => {
    fastify.get("/profile", { schema: schema }, getprofile);
    next();
}


module.exports = GetProfile;