const { UserUnauthorized, RefreshTokenExpired } = require("./errors.js");

const axiosToken = require("axios").create({
    baseURL: "https://www.bungie.net/Platform/App/OAuth/token/",
    method: "POST",
    data: new URLSearchParams({
        client_secret: process.env.BUNGIE_CLIENT_SECRET,
        client_id: process.env.BUNGIE_CLIENT_ID,
    })
});

async function validateSession(user){
    if(!user.isLoggedIn){
        if(!user._querycode)
            return Promise.reject(new UserUnauthorized("No auth data, and no query code, user is not authorized."));
        await axiosToken.request({ 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: {
                "grant_type": "authorization_code",
                "code": user._querycode
            }
        }).then( (result) => user.authData = result.data)
        .catch( (error) => Error(error));
    }
    let expire = user.tokenExpirations;
    if(Date.now() > expire.access){
        if(Date.now() > expire.refresh)
            return Promise.reject(new RefreshTokenExpired("Refresh token has expired, user will need to re-authenticate."));
        await axiosToken.request({ 
            headers: {"X-API-Key": process.env.BUNGIE_API_KEY },
            data: {
                "grant_type": "refresh_token",
                "refresh_token": user._authdata.refresh_token
            }
        }).then( (result) => user.authData = result.data)
        .catch( (error) => Error(error));
    }
    return true;
}
async function validateProfiles(request){
    let user = request.session.user;
    if(user.activeProfile)
        return true;
    if(user.availableProfileIds.length != 0){
        user.activeProfile = user.availableProfileIds[0];
        return true;
    }
    // if here, there are no user profiles, we need to retrieve them from bungie
    const openapiurl = "/User/GetMembershipsById/{membershipId}/{membershipType}/";
    let uri = request.InjectURI(openapiurl, {
        membershipId: user._user.membershipId,
        membershipType: -1
    });
    let response = await request.BClient(uri)
    .then( (resp) => MapResponse(resp, openapiurl, "UserData", user._user.language))
    user._user.profiles = response.destinyMemberships;
    user.activeProfile = response.primaryMembershipId ? 
        response.primaryMembershipId : Object.keys(user.availableProfileIds)[0];
    return true;
}

module.exports = (request, reply) => {
    return validateSession(request.session.user)
    .then( (success) =>{
        request.BClient.defaults.headers["Authorization"] = "Bearer "+request.session.user.accessToken;
        return validateProfiles(request);
    })
    .catch( (error) => reply.code(400).send(error));
};

module.exports.validateProfiles = validateProfiles;
module.exports.validateSession = validateSession;