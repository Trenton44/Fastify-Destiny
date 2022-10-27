const path = require ('path');
const d2api = require(path.join(__dirname, "..", "..", "/bungie-api/api.js"))
const config = require("./config.js");

function saveTokenData(session_store, token_data){
    session_store.auth_data = {
        access_token: token_data.access_token,
        token_type: token_data.token_type,
        access_expiration: Date.now() + token_data.expires_in,
        refresh_token: token_data.refresh_token,
        refresh_exipration: Date.now() + token_data.refresh_expires_in
    };
    if(session_store.user_data == undefined) {
        session_store.user_data = {};
    }
    session_store.user_data.membership_id = token_data.membership_id;
    session_store.cookie.maxAge = session_store.auth_data.refresh_exipration;
    return true;
}

async function validateSession(sessionstore){
    if(!sessionstore.auth_data){
        if(!sessionstore.query_code)
            return Promise.reject({ error: "you have not given authorization to this API yet." });
        await d2api.requestToken(true, sessionstore.query_code)
        .then( (result) => saveTokenData(sessionstore, result.data))
        .catch( (error) => d2api.bungieErrorResponse(error, "unable to process query code."));
    }
    let access_expire = sessionstore.auth_data.access_expiration;
    let refresh_expire = sessionstore.auth_data.refresh_exipration;
    if(Date.now() > access_expire){
        if(Date.now() > refresh_expire)
            return Promise.reject({error: "Refresh token expired, user will need to re-authenticate"});
        await d2api.requestToken(false, sessionstore.auth_data.refresh_token)
        .then( (result) => saveTokenData(sessionstore, result.data))
        .catch( (error) => d2api.bungieErrorResponse(error, "Refresh token expired, user will need to re-authenticate"));
    }
    if(!sessionstore.d2_account){
        //console.log("no data found, but we know membership_id exists, so we will pull d2 data from bungie.")
        // create a config object for this d2 request inside this folder (/AuthO), make a request with the openapischemaurl, the config object, and necessary paraemters to get back the info.
        await d2api.GetMembershipDataById(sessionstore.auth_data.access_token, sessionstore.user_data.membership_id, "-1", config)
        .then( (result) => {
            sessionstore.user_data.d2_account = result;
            if(result.primaryMembershipId)
                sessionstore.user_data.active_account_id = result.primaryMembershipId; //if primary membership id is valid, set it as the active account for the frontend.
            else
                sessionstore.user_data.active_account_id = Object.keys(result.destinyMemberships)[0]; //if no primarymembership, just take the first membership that shows up.
        })
        .catch( (error) => d2api.bungieErrorResponse(error, "well, something went wrong obtaining d2_membership_id, so you need to re-authenticate."));
    }
    return Promise.resolve(sessionstore.user_data.active_account_id);
}

module.exports = validateSession;