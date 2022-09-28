const path = require ('path');
const d2api = require(path.join(__dirname, '..', '/bungie_api/api.js'));
const crypto = require('crypto');
const axios = require('axios');

const bungie_root = "https://www.bungie.net";
const api_root = bungie_root+"/Platform";
const auth_url = bungie_root+"/en/OAuth/Authorize";
const token_url = api_root+"/App/OAuth/token/";
const refresh_url = api_root+"/App/OAuth/token/";

function AuthORedirectURL(){
    let request_body = {
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: crypto.randomBytes(16).toString("base64")
    };
    let state = request_body.state; //declaring it here so it's easy to return at end
    request_body = new URLSearchParams(request_body);
    let redirect_url = new URL(auth_url);
    redirect_url.search = request_body;
    return [encodeURI(redirect_url), state];
};

function getD2MembershipData(token, membership_id){
    return d2api.GetMembershipDataById(token, membership_id)
    .then((result) => {
        let data = result.data.Response;
        let d2_account = {};
        data.destinyMemberships.forEach(function(current){
            if(current.crossSaveOverride != current.membershipType)
                return;
            d2_account.id = current.membershipId;
            d2_account.membership_type = current.membershipType;
            return;
        });
        return d2_account;
    })
    .catch((error) => {
        return error;
    });
}

function requestAccessToken(authorization_code){
    let request_body = {
        method: "POST",
        url: token_url,
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        data: new URLSearchParams({
            client_secret: process.env.BUNGIE_CLIENT_SECRET,
            client_id: process.env.BUNGIE_CLIENT_ID,
            grant_type: "authorization_code",
            code: authorization_code,
        })
    };
    return axios(request_body)
}
function requestRefreshToken(refresh_token){
    let request_body = {
        method: "POST",
        url: refresh_url,
        headers: {"X-API-Key": process.env.BUNGIE_API_KEY},
        data: new URLSearchParams({
            client_secret: process.env.BUNGIE_CLIENT_SECRET,
            client_id: process.env.BUNGIE_CLIENT_ID,
            grant_type: "refresh_token",
            refresh_token: refresh_token, //this was decrypted in original code here, will need to add this functionality
        })
    };
    return axios(request_body)
}

module.exports = {AuthORedirectURL, getD2MembershipData, requestAccessToken, requestRefreshToken};