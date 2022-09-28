//All handler functions for the server's endpoints
//I originally had these split into two files, authorized/unauthorized endpoint handlers, but there's not enough of them to really warrant that atm.

const fs = require('fs');
const path = require ('path');
const helper = require(path.join(__dirname, 'helper_functions.js'));
const d2helper = require(path.join(__dirname, './bungie_api/wrapper.js'));
const d2api = require(path.join(__dirname, './bungie_api/api.js'));
const data_processor = require(path.join(__dirname, './bungie_api/dataMap.js'));
const data_transformer = require("./bungie_api/dataTransform.js");

//FOLLOWING ENDPOINTS DO NOT REQUIRE AUTHORIZATION TO ACCESS
async function oAuthRequest(request, reply){
    //redirect to bungie AuthO portal.
    let [url, state] = d2helper.AuthORedirectURL();
    request.session.state = state;
    console.log(request.session.state);
    return reply.redirect(url);
}
async function oAuthResponse(request, reply){
    if(request.session.state != decodeURIComponent(request.query.state)){
        request.session.destroy()
        return reply.code(400).send("Unable to validate session, user must re-authenticate.");
    }
    return d2helper.requestAccessToken(request.query.code)
    .then( (result) => { 
        //save or overwrite session's token data
        helper.saveTokenData(request.session, result.data); 
        //redirect to root, which will cause prehandler to obtain d2_membership_id, and root will reroute to /user/:id
        return reply.code(303).redirect("/");
    }).catch( (error) => { 
        //Something went wrong, just display error text on the screen
        console.log(error);
        return reply.code(400).send("unable to obtain access token."); 
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
        return error;
    });
}

async function api_profileData(request, reply){
    let d2_membership_id = request.query.d2_membership_id;
    let membership_type = request.session.user_data.d2_account.membership_type;
    let token = request.session.auth_data.access_token;
    let list = { compoents: ["100", "102", "103", "200", "201", "203", "205", "300"]};
    return d2api.GetProfile(token, d2_membership_id, list, membership_type)
    .then( (result) => {
        let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let request_type = "get";
        let code = "200";
        let parsed_data = data_processor(api_doc_link, request_type, code, result.data.Response);
        return parsed_data;
    }).catch( (error) => {
        console.log(error);
        return Error("Nope.");
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
        let parsed_data = data_processor(api_doc_link, request_type, code, data);
        return parsed_data;
    }).catch( (error) => {
        console.log(error)
        return Error("unable to get character data.");
    });
}

module.exports = {api_characterIds, api_characterData, api_profileData, oAuthRequest, oAuthResponse};