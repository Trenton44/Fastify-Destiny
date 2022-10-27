/**
 * @module APIWrapper
 * @property {module:GetDestinyManifest} GetDestinyManifest
 */
const axios = require('axios');
const bungieroot = "https://www.bungie.net";
const apiroot = bungieroot+"/Platform";
const authurl = bungieroot+"/en/OAuth/Authorize";
const tokenurl = apiroot+"/App/OAuth/token/";

//  Use OPENAPI url (found in openapi.json, keys under "paths") 
//  and inject parameters required for making a request
function InjectURLParameters(url, paramobj){
    for(parameter in paramobj)
        url = url.replace("{"+parameter+"}", paramobj[parameter]);
    return url;
}
function APIRequest(openapiurl, pathparameters, queryparameters, token, components=false){
    let path = new URL(apiroot+InjectURLParameters(openapiurl, pathparameters));
    if(queryparameters){ path.search = new URLSearchParams(queryparameters); }
    return get(path.toString(), token);
}

function get(path, token){
    let request_object = {
        method: "GET",
        url: path,
        headers: {"X-API-Key":process.env.BUNGIE_API_KEY},
    };
    if(token){ request_object.headers.Authorization = "Bearer "+token; }
    return axios(request_object);
}
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
function requestToken(isaccess, data){
    let requestbody = {
        method: "POST",
        url: tokenurl,
        data: new URLSearchParams({
            client_secret: process.env.BUNGIE_CLIENT_SECRET,
            client_id: process.env.BUNGIE_CLIENT_ID,
        })
    };
    if(isaccess){
        requestbody.headers = {"Content-Type": "application/x-www-form-urlencoded"};
        requestbody.data.append("grant_type", "authorization_code");
        requestbody.data.append("code", data);
    }
    else{
        requestbody.headers = {"X-API-Key": process.env.BUNGIE_API_KEY };
        requestbody.data.append("grant_type", "refresh_token");
        requestbody.data.append("refresh_token", data);
    }
    return axios(request_body);
}

function bungieErrorResponse(error, message){
    console.error(error);
    if(message)
        return Promise.reject({ error: message });
    return Promise.reject({ error: error });
}

module.exports = { APIRequest, requestToken, bungieErrorResponse };

