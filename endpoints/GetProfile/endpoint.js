
const path = require("path");
const configuration = require("./config");

const schema = require("./schema.json");

//The function used to process the receiving data.
//This will ready the necessary data for the Bungie API call, and then pass this to a function inside wrapper.js
async function getprofile(request, reply){
    let membershipId = request.session.user_data.active_account_id;
    let membershipType = request.session.user_data.d2_account.destinyMemberships[membershipId].membershipType;
    let components = request.query.components;
    return request.d2api.GetProfile(membershipId, membershipType, components, request.session.auth_data.access_token, configuration)
    .then( (data) => {
        return data;
    })
    .catch( (error) => {
        console.error(error);
        return error;
    });
}

let GetProfile = (fastify, options, next) => {
    fastify.get("/profile", { schema: schema }, getprofile);
    next();
}


module.exports = GetProfile;