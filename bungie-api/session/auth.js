import { RefreshTokenExpired, UserUnauthorized } from "../errors.js";
import { default as axios } from "axios";

const axiosToken = axios.create({
    baseURL: "https://www.bungie.net/Platform/App/OAuth/token/",
    method: "POST",
    transformRequest: [
        (data, headers) => {
            data.client_secret = process.env.BUNGIE_CLIENT_SECRET;
            data.client_id = process.env.BUNGIE_CLIENT_ID;
            return new URLSearchParams(data).toString();
        }
    ]
});

const setDefaultProfile = (user) => {
    user.activeProfile = user.userProfiles[Object.keys(user.userProfiles)[0]].destinyMembershipId;
    return true;
};

const LoginInitiated = async (user) => {
    return user.isLoggedIn ? true : 
        !user.data._querycode ? Promise.reject(new UserUnauthorized()) :
        axiosToken.request({
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: {
                "grant_type": "authorization_code",
                "code": user.data._querycode
            }
        }).then((result) => {
            user.authData = result.data;
            return true;
        });
};
    
const updateTokens = async (user) => {
    return Date.now() < user.accessExpires ? true :
        Date.now() > user.refreshExpires ? Promise.reject(new RefreshTokenExpired()) :
        axiosToken.request({
            headers: {"X-API-Key": process.env.BUNGIE_API_KEY },
            data: {
                "grant_type": "refresh_token",
                "refresh_token": user.refreshToken
            }
        }).then((result) => {
            user.authData = result.data;
            return true;
        });
};

const GetUserProfile = async (request) => {
    let data = await request.BClient("/User/GetMembershipsById/{membershipId}/{membershipType}/", {
        params: {
            membershipId: request.session.data.userID,
            membershipType: -1
        }
    }).catch((error) => Promise.reject(error));
    request.session.data.userProfiles = data.destinyMemberships;
    request.session.data.activeProfile = data.primaryMembershipId ? data.primaryMembershipId : setDefaultProfile(request.session.data);
    return true;
}
const UserExists = async (request) => {
    return request.session.data.activeProfile ? true :
        request.session.data.hasProfile ? setDefaultProfile(request.session.data) : GetUserProfile(request);
}

export default async function(request, reply) {
    let userdata = request.session.data;
    await LoginInitiated(userdata);
    await updateTokens(userdata);
    request.BClient.defaults.headers.Authorization = "Bearer "+ request.session.data.accessToken;
    await UserExists(request);
};
export { UserExists, updateTokens, LoginInitiated, setDefaultProfile };