//All handler functions for the server's endpoints
//I originally had these split into two files, authorized/unauthorized endpoint handlers, but there's not enough of them to really warrant that atm.

const fs = require('fs');
const path = require ('path');
const helper = require(path.join(__dirname, 'helper_functions.js'));
const d2helper = require(path.join(__dirname, './bungie_api/wrapper.js'));
const d2api = require(path.join(__dirname, './bungie_api/api.js'));
const data_processor = require(path.join(__dirname, './bungie_api/dataMap.js'));
const data_transformer = require("./bungie_api/backendTransformations.js");

//FOLLOWING ENDPOINTS DO NOT REQUIRE AUTHORIZATION TO ACCESS
async function oAuthRequest(request, reply){
    //redirect to bungie AuthO portal.
    let [url, state] = d2helper.AuthORedirectURL();
    request.session.state = state;
    return reply.code(303).redirect(url);
}
async function oAuthResponse(request, reply){
    if(request.session.state != decodeURIComponent(request.query.state)){
        console.log("States "+request.session.state+" (session) and "+decodeURIComponent(request.query.state)+" (query) did not match! destroying session.");
        request.session.destroy();
        return reply.code(400).send({error: "Unable to validate session, user must re-authenticate."});
    }
    return d2helper.requestAccessToken(request.query.code)
    .then( (result) => { 
        //save or overwrite session's token data
        helper.saveTokenData(request.session, result.data); 
        request.log.warn("SUCCESSFULLY SAVED ACCESS TOKEN.");
        return reply.code(303).redirect(process.env.FRONTEND_SERVER);
    }).catch( (error) => { 
        //Something went wrong, just display error text on the screen
        console.log(error);
        return reply.code(400).send({error: "unable to obtain access token."}); 
    });
}


//FOLLOWING ENDPOINTS REQUIRE AUTHORIZATION TO ACCESS
async function api_characterIds(request, reply){
    request.log.info("User is requesting to access character ids under this d2 account.");
    let id = request.query.id; //this is a d2_membership_id.
    let token = request.session.auth_data.access_token;
    let membership_type = request.session.user_data.d2_account.membership_type;
    //component 100 returns basic info from api about character, most importantly character ids
    return d2api.GetProfile(token, id, { components: ["100"]}, membership_type)
    .then( (result) => {
        let data = result.data.Response.profile.data;
        return data.characterIds;
    }).catch( (error) => {
        return Promise.reject(error);
    });
}

async function api_profileData(request, reply){
    let openapi_url = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
    let components = { components: ["100", "102", "103", "200", "201", "203", "205", "300"] };
    let path_params = {
        membershipType: request.session.user_data.d2_account.membership_type,
        destinyMembershipId: request.query.d2_membership_id,
    }
    return d2api.GetProfile(openapi_url, path_params, components, request.session.auth_data.access_token)
    .then( (result) => [result.status, result.data])
    .then( ([status, data]) => {
        return data_processor(openapi_url, "get", status, data.Response, data_transformer);
    })
    .catch( (error) => {
        console.error(error);
        return {error: "Failed to fetch data." }
    });
}

async function api_characterData(request, reply){
    request.log.info("User is requesting to access a character's data under this d2 account.");
    let d2_membership_id = request.query.d2_membership_id;
    let character_id = request.query.character_id;
    let token = request.session.auth_data.access_token;
    let membership_type = request.session.user_data.d2_account.membership_type;
    
    //components in order: Characters, Inventory, Equipment, item perks, instancedItem's data, & item stats
    let list = { components: ["200", "201", "205", "302", "300", "304"] };
    return d2api.GetCharacter(token, d2_membership_id, character_id, list, membership_type)
    .then( (result) => {
        let data = result.data.Response;
        let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/Character/{characterId}/";
        let request_type = "get";
        let code = "200";
        let parsed_data = data_processor(api_doc_link, request_type, code, data, {});
        return parsed_data;
    }).catch( (error) => {
        console.log(error)
        return Promise.reject("unable to get character data.");
    });
}

async function returnD2ID(request, reply){
    console.log("ID: "+request.session.sessionId);
    console.log("here");
    //The prehandler should have verified that membership_id and a d2_id exist in the session, so this endpoint is just to return the d2 id.
    if(request.session.user_data.d2_account == undefined)
        return reply.code(400).send({error: "account does not exist."});
    return reply.send({d2_membership_id: request.session.user_data.d2_account.id});
}
module.exports = {returnD2ID, api_characterIds, api_characterData, api_profileData, oAuthRequest, oAuthResponse};