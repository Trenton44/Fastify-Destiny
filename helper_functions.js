const path = require ('path');
const d2helper = require(path.join(__dirname, '..', '/bungie_api/wrapper.js'));

async function validateTokens(session_store){
    //if auth_data isn't set, user has never logged in.
    if(session_store.auth_data == undefined) {
        return Promise.reject("Not authorized to access");
    }

    //User has logged in previously, check to make sure access/refresh tokens are still valid.
    // note both tokens are saved using Date.now() + (token's expiration timer)
    let at_expire = session_store.auth_data.access_expiration;
    let rt_expire = session_store.auth_data.refresh_exipration;
    if(Date.now() > at_expire){
        
        //If it's expired, nothing we can do, they gotta log back in
        if(Date.now() > rt_expire) {
            return Error("Refresh token expired, user will need to re-authenticate");
        }
        //refresh token is still valid, obtain new access/refresh from bungie api.
        return d2helper.requestRefreshToken(session_store.auth_data.refresh_token)
        .then( (result) => {
            saveTokenData(session_store, result.data);
            return true;
        }).catch( (error) => { return error; });
        //Save the token data & bungie membership_id to the session store
    }
}
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
module.exports = {validateTokens, saveTokenData};