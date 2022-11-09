/**
 * @module Endpoints 
*/
const Root = require("./root.js");
const Login = require("./login.js");
const validate = require("./session.js");

const GetProfileSchema = require("../schemas/GetProfile.json");

let general = (fastify, options, next) => {
    fastify.register(Root);
    fastify.register(Login);
    next();
};

let user = (fastify, options, next) => {
    fastify.addHook('preHandler', async (request, reply) => {
        return validate(request.session)
        .catch( (error) => reply.code(400).send({error: error}));
    });
    
    fastify.get("/GetProfile", { schema, GetProfileSchema }, async (request, reply) =>{
        const openapiurl = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let pathparams = {
            destinyMembershipId: request.session.user_data.active_account_id,
            membershipType: request.session.user_data.d2_account.destinyMemberships[activeId].membershipType,
        };
        let queryparams = { components: request.query.components };
        let components = request.query.components;
        let token = request.session.auth_data.access_token;
        return request.APIRequest(openapiurl, pathparams, queryparams, token);
    });
    next();
};

module.exports = (fastify, options, next) => {
    fastify.register(general);
    fastify.register(user);
    next();
}