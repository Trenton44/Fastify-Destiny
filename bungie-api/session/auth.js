const { UserUnauthorized } = require("../errors");

const axiosToken = require("axios").create({
    baseURL: "https://www.bungie.net/Platform/App/OAuth/token/",
    method: "POST",
    transformRequest: [
        (data, headers) => {
            data["client_secret"] = process.env.BUNGIE_CLIENT_SECRET;
            data["client_id"] = process.env.BUNGIE_CLIENT_ID;
            return new URLSearchParams(data).toString();
        }
    ]
});

const setDefaultProfile = (userdata) => {
    userdata.activeProfile = userdata._user.profiles(Object.keys(userdata._user.profiles)[0]).destinyMembershipId;
    return true;
}

const LoginInitiated = (user) => {
    return user.isLoggedIn ? true : 
        !user._querycode ? Promise.reject(new UserUnauthorized()) :
        axiosToken.request({
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: {
                "grant_type": "authorization_code",
                "code": user._querycode
            }
        }).then((result) => user.authData = result.data);
}
    
const updateTokens = (user) => {
    return Date.now() < user.tokenExpirations.access ? Promise.resolve(true) :
        Date.now() > user.tokenExpirations.refresh ? Promise.reject(new RefreshTokenExpired()) :
        axiosToken.request({
            headers: {"X-API-Key": process.env.BUNGIE_API_KEY },
            data: {
                "grant_type": "refresh_token",
                "refresh_token": user._authdata.refresh_token
            }
        }).then((result) => user.authData = result.data);
}

const getUserProfile = (request) => {
    return request.BClient(
        "/User/GetMembershipsById/{membershipId}/{membershipType}/",
        {
            membershipId: request.session.data._user.membershipId,
            membershipType: -1
        },
        request.session.data.language
    )
    .then((data) => {
        request.session.data._user.profiles = data.destinyMemberships;
        request.session.data.activeProfile = response.primaryMembershipId ? 
            response.primaryMembershipId : setDefaultProfile(request.session.data);
    });
}

const UserExists = (request) => {
    return request.session.data.activeProfile ? true :
        request.session.data.hasProfile ? setDefaultProfile(request.session.data) : getUserProfile(request);
}

if(process.env.NODE_ENV == "test"){
    module.exports.UserExists = UserExists;
    module.exports.getUserProfile = getUserProfile;
    module.exports.updateTokens = updateTokens;
    module.exports.LoginInitiated = LoginInitiated;
    module.exports.setDefaultProfile = setDefaultProfile; 
}
module.exports = async (request, reply) => {
    await LoginInitiated(userdata);
    await updateTokens(userdata);
    request.BClient.defaults.headers["Authorization"] = "Bearer "+request.session.user.accessToken;
    await UserExists(request);
};