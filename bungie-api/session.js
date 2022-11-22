const axios = require("axios");
const { MapResponse } = require("./api.js");
const { UserUnauthorized } = require("./errortypes.js");

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
            profiles: {}
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
        get userProfiles(){ return {
            active: this._user.active,
            profiles: this._user.profiles
        }},
        get accessToken(){ return this._authdata.access_token; },
        get tokenExpiration(){
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
            throw new UserUnauthorized("No auth data, and no query code, user is not authorized.");
        await axiosToken.post("", { 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: {
                "grant_type": "authorization_code",
                "code": session._querycode
            }
        }).then( (result) => session.authData(result.data))
    }
    let expire = session.tokenExpiration;
    if(Date.now() > expire.access){
        if(Date.now() > expire.refresh)
            throw new UserUnauthorized("Refresh token has expired, user will need to re-authenticate.");
        await axiosToken.post("", { 
            headers: {"X-API-Key": process.env.BUNGIE_API_KEY },
            data: {
                "grant_type": "refresh_token",
                "refresh_token": session._authdata.refresh_token
            }
        }).then( (result) => session.authData(result.data));
    }
   return true;
}
async function validateProfiles(request){
    let session = request.session;
    if(session.activeProfile)
        return true;
    if(session.availableProfileIds.length != 0){
        session.activeProfile = session.availableProfileIds[0];
        return true;
    }
    // if here, there are no user profiles, we need to retrieve them from bungie
    const openapiurl = "/User/GetMembershipsById/{membershipId}/{membershipType}/";
    let uri = request.InjectURI(openapiurl, {
        membershipId: session._user.membershipId,
        membershipType: -1
    });
    let response = await request.BClient(uri)
    .then( (resp) => MapResponse(resp, openapiurl, "UserData", session._user.language))
    session._user.profiles = response.destinyMemberships;
    session.activeProfile = response.primaryMembershipId ? 
        response.primaryMembershipId : Object.keys(session.availableProfileIds)[0];
    return true;
}

async function BungieLogin(request, reply){
    let redirect = new URL("https://www.bungie.net/en/OAuth/Authorize");
    let state = crypto.randomBytes(16).toString("base64");
    request.session._state = state;
    redirect.search = new URLSearchParams({
        client_id: process.env.BUNGIE_CLIENT_ID,
        response_type: "code",
        state: state
    });
    return reply.code(303).redirect(encodeURI(redirect));
}

async function BungieLoginResponse(request, response){
    let valid = request.session._state === decodeURIComponent(request.query.state);
    if(!valid){
        request.session.destroy();
        return reply.code(400).send({ error: "Invalid state parameter, user must re-authenticate." });
    }
    request.session._querycode = request.query.code;
    return reply.code(303).redirect(process.env.ORIGIN);
}

module.exports = { buildSession, validateSession, validateProfiles, BungieLogin, BungieLoginResponse };