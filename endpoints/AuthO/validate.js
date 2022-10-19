const path = require ('path');
const d2 = require(path.join(__dirname, "..", "..", "/bungie-api/wrapper.js"));

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
        //console.log("No auth data, checking for query code.");
        if(!sessionstore.query_code)
            return Promise.reject({ error: "you have not given authorization to this API yet." });
        await d2.requestAccessToken(sessionstore.query_code)
        .then( (result) => saveTokenData(sessionstore, result.data))
        .catch( (error) => d2.bungieErrorResponse(error, "unable to process query code."));
    }
    //console.log("Session_data: "+sessionstore.auth_data);
    let access_expire = sessionstore.auth_data.access_expiration;
    let refresh_expire = sessionstore.auth_data.refresh_exipration;
    if(Date.now() > access_expire){
        if(Date.now() > refresh_expire)
            return Promise.reject({error: "Refresh token expired, user will need to re-authenticate"});
        await d2.requestRefreshToken()
        .then( (result) => saveTokenData(sessionstore, result.data))
        .catch( (error) => d2.bungieErrorResponse(error, "Refresh token expired, user will need to re-authenticate"));
    }
    if(!sessionstore.d2_account){
        //console.log("no data found, but we know membership_id exists, so we will pull d2 data from bungie.")
        await d2.getD2MembershipData(sessionstore.auth_data.access_token, sessionstore.user_data.membership_id)
        .then( (result) => { sessionstore.user_data.d2_account = result; return true; })
        .catch( (error) => d2.bungieErrorResponse(error, "well, something went wrong obtaining d2_membership_id, so you need to re-authenticate."));

    }
    return Promise.resolve(sessionstore.user_data.membership_id);
}

module.exports = validateSession;