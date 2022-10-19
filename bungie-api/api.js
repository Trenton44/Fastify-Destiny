/**
 * @module APIWrapper
 * @property {module:GetDestinyManifest} GetDestinyManifest
 */
const axios = require('axios');
const dataprocess = require("./DataMapAsync");

const bungie_root = "https://www.bungie.net";
const api_root = bungie_root+"/Platform";
const auth_url = bungie_root+"/en/OAuth/Authorize";
const token_url = api_root+"/App/OAuth/token/";
const refresh_url = api_root+"/App/OAuth/token/";

/**
 * @function InjectParametersIntoAPIURL
 * @private
 * @param { string } url_string 
 * @param { Object }} param_obj 
 * @returns string
 */
function InjectParametersIntoAPIURL(url_string, param_obj){
    for(property in param_obj)
        url_string = url_string.replace("{"+property+"}", param_obj[property]);
    return url_string;
}

/**
 * @function GetDestinyManifest
 * @returns Object - The Destiny 2 Manifest
 */
function GetDestinyManifest(){
    let path = api_root+"/Destiny2/Manifest/";
    return get(path);
};

/**
 * @function GetProfile
 * @param { number } membershipId - The id of your Destiny 2 account
 * @param { number } membershipType - the membership type associated with membershipId. -1 will search for all types
 * @param { string[] } components - List of [DestinyComponentType]{@link https://bungie-net.github.io/multi/schema_Destiny-DestinyComponentType.html#schema_Destiny-DestinyComponentType%7D} Components you wish to receive. Use the strings, not the numbers
 * @param { number } token - The access token of the account you are requesting data on behalf of.
 * @param { Object } datatransform - the config object you wish to pass for transforming data [ See Transforming Data ]{ @link }
 * @returns Object
 */
function GetProfile(membershipId, membershipType, components, token, datatransform){
    let openapiurl = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";
    let pathparams = {
        membershipType: membershipType,
        destinyMembershipId: membershipId,
    }
    let path = new URL(api_root+InjectParametersIntoAPIURL(openapi_url, pathparams));
    path.search = new URLSearchParams({ components: components });
    path = path.toString();
    return get(path, token)
    .then( (result) => [result.status, result.data])
    .then( ([status, data]) => {
        data = dataprocess(openapiurl, "get", status, data.Response, datatransform);
        return data;
    })
    .catch( (error) => Promise.reject(error));
}

/**
 * @function GetMembershipDataById
 * @param { number } token 
 * @param { number } membershipId 
 * @param { number } membershipType 
 * @param { Object } datatransform 
 * @returns Object
 */
function GetMembershipDataById(token, membershipId, membershipType, datatransform){
    let openapiurl = "/User/GetMembershipsById/{membershipId}/{membershipType}/";
    let pathparams = {
        membershipId: membershipId,
        membershipType: membershipType
    }
    let path = new URL(api_root + InjectParametersIntoAPIURL(openapiurl, pathparams)).toString();
    return get(path, token, datatransform)
    .then( (result) => [result.status, result.data])
    .then( ([status, data]) => {
        data = dataprocess(openapiurl, "get", status, data.Response, datatransform);
        return data;
    })
    .catch( (error) => Promise.reject(error));
};

/**
 * @function get
 * @param { string } path 
 * @param { number } token 
 * @returns Promise
 */
function get(path, token){
    let request_object = {
        method: "GET",
        url: path,
        headers: {"X-API-Key":process.env.BUNGIE_API_KEY},
    };
    if(token){ request_object.headers.Authorization = "Bearer "+token; }
    return axios(request_object);
}

/**
 * @function post
 * @param { string } path 
 * @param { number } token 
 * @returns Promise 
 */
function post(path, body, token){
    let request_object = {
        method: "POST",
        url: path,
        headers: {"X-API-Key":process.env.BUNGIE_API_KEY},
        data: body
    };
    if(token){ request_object.headers.Authorization = "Bearer "+token; }
    return axios(request_object);
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

function bungieErrorResponse(error, message){
    console.error(error);
    if(message)
        return Promise.reject({ error: message });
    return Promise.reject({ error: error });
}

module.exports = { requestAccessToken, requestRefreshToken, bungieErrorResponse, GetDestinyManifest, GetMembershipDataById, GetProfile};