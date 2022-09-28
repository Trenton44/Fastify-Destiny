//File containing all the endpoints used by server.js 
//Put them here to keep the code from getting dense and annoying to read.
const path = require ('path');
const fastify = require('fastify'); //fastify objects aren't instantiated here, just passed, so i don't use this call. But nodejs throws a fit if it isn't here, so here we are.

const handler = require('./server_handlers.js');
const helper = require(path.join(__dirname, './helper_functions.js'));
const d2helper = require(path.join(__dirname, './bungie_api/wrapper.js'));

//all /api endpoints that do not require authorization with bungie.
let api_noauth = (fastify, options, next) => {
    //nothing necessary in the prehandler atm, but I'm keeping it for consistency with authorized endpoints
    fastify.addHook('preHandler', async function(request, reply){ return true; });
    //these two /api endpoints are for authorizing with the bungie api, and processing the response from bungie
    fastify.get('/api/login', handler.oAuthRequest);
    fastify.get('/api/login_response', handler.oAuthResponse);
    fastify.get('/api/*', async (request, reply) => { return reply.code(404).send({error: "endpoint not found."}); });
    next();
};

// Contains all endpoints that require bungie api authorization to access
// prehandler at start verifies that autorization is granted, returns error otherwise.
// These endpoints should only be used by fronted to obtain data, not load webpages.
let api_auth = (fastify, options, next) => {
    //returns error if validation fails.
    fastify.addHook('preHandler', validateAPIEndpointAccess);
    //endpoints accessible to appliation
    fastify.get('/api/authvalidated');
    fastify.get('/api/profileID', handler.returnD2ID);
    fastify.get('/api/profileData', handler.api_profileData);
    fastify.get('/api/characterIds', handler.api_characterIds); //needs a schema verifying request had d2_membership_id as a querystring
    fastify.get('/api/characterData', handler.api_characterData); //needs a schema verifying request has querystring with d2_membership_id and characterId
    //Catch all 404 response
    

    next();
}


//validates access to the endpoints contained in this file.
async function validateAPIEndpointAccess(request, reply){
    return helper.validateTokens(request.session)
    .then( (result) => {
        
        //check for membership_id. this should be obtained with the access tokens
        // so if we're this far and it's missing, something's gone horribly wrong.
        if(request.session.user_data.membership_id == undefined)
            return reply.code(400).send("the membership id's gone missing, I'm gonna need you to login");

        // ensure that at least one d2 account has data stored in this session.
        // validating that passed data from the frontend matches the session's will be the problem of the endpoints,
        // we just want to ensure something is there as a minimum.
        if(request.session.user_data.d2_account != undefined)
            return true;

        request.log.warn("no data found, but we know membership_id exists, so we will pull d2 data from bungie.")
        return d2helper.getD2MembershipData(request.session.auth_data.access_token, request.session.user_data.membership_id)
        .then( (result) => {
            request.session.user_data.d2_account = result;
            return true;
        }).catch( (error) => {
            request.log.error("well, something went wrong obtaining d2_membership_id, so you need to re-authenticate.");
            return reply.code(400).send({ error: "well, something went wrong obtaining the id, so you need to re-authenticate."});
        });
    }).catch( (error) => {
        //return the error response generated in validateTokens to frontend
        return reply.code(400).send(error);
    });
}

module.exports = {api_noauth, api_auth};


