const session = require("express-session");
const axios = require("axios");

const axiosToken = axios.create({
    baseURL: "https://www.bungie.net/Platform/App/OAuth/token/",
    method: "POST",
    data: new URLSearchParams({
        client_secret: process.env.BUNGIE_CLIENT_SECRET,
        client_id: process.env.BUNGIE_CLIENT_ID,
    })
});

function buildSession(store){
    return {
        _authdata: {},
        _user: {
            language: "en",
            membershipId: false,
            active: false,
            profiles: []
        },
        get language(){ return this._user.language; },
        set language(language){ this._user.language = language; },
        get isLoggedIn(){
            for(let i in this._authdata)
                return true; // only reaches here if authdata is not empty.
            return false;
        },
        get activeProfile(){ return this._user.profiles[this._user.active]; },
        set activeProfile(id){ this._user.active = id; },
        get availableProfileIds(){
            // TODO: need to implement session validation and decide on blueprint first.
        },
        get accessToken(){ return this._authdata.access_token; },
        get tokenExipiration(){
            return {
                access: this._authdata.access_expires,
                refresh: this._authdata.refresh_expires
            };
        },
        set authData(data){
            this._authdata = {
                access_token: data.access_token,
                token_type: data.token_type,
                access_expires: Date.now() + data.expires_in,
                refresh_token: data.refresh_token,
                refresh_expires: Date.now() + data.refresh_expires_in
            }
            this._user.membershipId = data.membership_id;
            store.cookie.maxAge = this._authdata.refresh_expires;
        },
        get logout(){
            // TODO
        }
    }
};

async function validateSession(session){
    if(!session.isLoggedIn){
        if(!session._querycode)
            Promise.reject("No auth data, and no query code, user is not authorized.");
        await axiosToken.post("", { 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: {
                "grant_type": "authorization_code",
                "code": session._querycode
            }
        }); //request Access Token
    }
    let expire = session.tokenExipiration;
    if(Date.now() > expire.access){
        if(Date.now() > expire.refresh)
            Promise.reject("Refresh token has expired, user will need to re-authenticate.");
        await axiosToken.post("", { 
            headers: {"X-API-Key": process.env.BUNGIE_API_KEY },
            data: {
                "grant_type": "refresh_token",
                "refresh_token": session._authdata.refresh_token
            }
        }); //request Refresh Token
    }
    if(!session.activeProfile){
        // no active profile exists, but user is authenticated, so we just need to fetch the data.
        let data = await ; // GetMembershipById
        session._user.profiles = data.destinyMemberships;
        if(data.primaryMembershipId)
            session.activeProfile(data.primaryMembershipId);
        else
            session.activeProfile(Object.keys(data.destinyMemberships)[0])
    }
    return session._user.active;
}
module.exports = { buildSession, validateSession };