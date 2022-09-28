const fs = require('fs');
const path = require ('path');
const helper = require(path.join(__dirname, '..', 'common_functions.js'));
const d2helper = require(path.join(__dirname, '..', '..', '/bungie_api/wrapper.js'));
const d2api = require(path.join(__dirname, '..', '..', '/bungie_api/api.js'));


const data_processor = require(path.join(__dirname, '..', '..', '/bungie_api/dataMap.js'));


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
    let list = { components: ["100", "102", "103", "200", "201", "203", "205", "300"]};
    return d2api.GetProfile(token, d2_membership_id, list, membership_type)
    .then( (result) => {
        let data = result.data.Response;
        let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let request_type = "get";
        let code = "200";
        let parsed_data = data_processor(api_doc_link, request_type, code, data);
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

async function test(request, reply){
    let d2_membership_id = request.query.d2_membership_id;
    let character_id = request.query.character_id;
    let token = request.session.auth_data.access_token;
    let membership_type = request.session.user_data.d2_account.membership_type;
    let list = { components: ["100", "101", "102", "103", "104", "105", "200", "201", "202", "203", "204", "205", "300", "301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "400", "401", "402", "500", "600", "700", "800", "900", "1000", "1100", "1200", "1300"] };
    console.log("sending request");
    return d2api.GetProfile(token, d2_membership_id,  list, membership_type)
    .then( (result) => {
        console.log("request received");
        let data = result.data.Response;
        let api_doc_link = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
        let request_type = "get";
        let code = "200";
        let parsed_data = data_processor(api_doc_link, request_type, code, data);
        return parsed_data;
    }).catch( (error) => {
        return error;
    });
}
module.exports = {api_characterIds, api_characterData, api_profileData, test}

