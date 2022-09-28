const axios = require('axios');

const bungie_root = "https://www.bungie.net";
const api_root = bungie_root+"/Platform";


// Functions categorized as "User" on the bnet API docs

async function GetCredentialTypesForTargetAccount(token, membership_id){
    let path = api_root+"/User/GetCredentialTypesForTargetAccount/"+membership_id+"/";
    return get(path, token);
};

// Functions categorized as "Destiny2" on the bnet API docs
function GetDestinyManifest(){
    let path = api_root+"/Destiny2/Manifest/";
    return get(path);
};

function SearchDestinyPlayerByBungieName(token, display_name, display_code, membership_type){
    if(!membership_type) membership_type = "-1"; // -1 is the enum value for all membership types. hopefully remove this hardcoding later.
    let body = {
        displayName: display_name,
        displayNameCode: display_code
    };
    let path = api_root+"/Destiny2/SearchDestinyPlayerByBungieName/"+membership_type+"/";
    return post(path, body, token);

};

function GetLinkedProfiles(token, membership_id, membership_type){
    if(!membership_type) membership_type = "-1"; // -1 is the enum value for all membership types. hopefully remove this hardcoding later.
    let path = api_root+"/Destiny2/"+membership_type+"/Profile/"+membership_id+"/LinkedProfiles/";
    return get(path, token);
};

function GetProfile(token, destiny_membership_id, components, membership_type){
    if(!membership_type) membership_type = "-1"; // -1 is the enum value for all membership types. hopefully remove this hardcoding later.
    let path = api_root + "/Destiny2/"+membership_type+"/Profile/"+destiny_membership_id+"/";
    let params = new URLSearchParams(components);
    path = new URL(path);
    path.search = params;

    return get(path.toString(), token);

};
function GetCharacter(token, destiny_membership_id, character_id, components, membership_type){
    let path = api_root + "/Destiny2/"+membership_type+"/Profile/"+destiny_membership_id+"/Character/"+character_id+"/";
    path = new URL(path);
    path.search = new URLSearchParams(components);
    return get(path.toString(), token);
}
function GetMembershipDataById(token, membership_id, membership_type){
    if(!membership_type) membership_type = "-1"; // -1 is the enum value for all membership types. hopefully remove this hardcoding later.
    let path = api_root+"/User/GetMembershipsById/"+membership_id+"/"+membership_type+"/";
    return get(path, token);
};

//FUNCTIONS TO SIMPLIFY GET/POST REQUESTS TO API
function get(path, token){
    let request_object = {
        method: "GET",
        url: path,
        headers: {"X-API-Key":process.env.BUNGIE_API_KEY},
    };
    if(token){ request_object.headers.Authorization = "Bearer "+token; }
    return axios(request_object)
}

function post(path, body, token){
    let request_object = {
        method: "POST",
        url: path,
        headers: {"X-API-Key":process.env.BUNGIE_API_KEY},
        data: body
    };
    if(token){ request_object.headers.Authorization = "Bearer "+token; }
    return axios(request_object)
}



module.exports = {GetDestinyManifest, GetCredentialTypesForTargetAccount, GetCharacter, GetMembershipDataById, GetLinkedProfiles, GetProfile, SearchDestinyPlayerByBungieName};