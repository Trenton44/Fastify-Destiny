const axios = require("axios");
const BungieResponse = require("./api_response.js");

// change to search for parameter string in uri
// if found, THEN replace string and delete parameter
// leave non-uri parameters untouched.
function InjectURIParameters(uri, parameters){
    for(let parameter in parameters){
        const searchString = "{"+parameter+"}";
        if(uri.search(searchString) == -1)
            continue;
        uri = uri.replace(searchString, parameters[parameter])
        delete parameters[parameter];
    }
    return uri;
}

const HTMLInterceptor = (response) => {
    return response.headers["content-type"] !== "application/json; charset=utf-8" ? Promise.reject("Bungie Service is currently unavailable") 
    : response.data.ErrorCode != 1 ? Promise.reject(response.data.ErrorStatus)
    : response;
};

const SetupRequest = (request) => {
    request.url = InjectURIParameters(request.url, request.params);
    return request;
}

const axiosBase = {
    baseURL: "https://www.bungie.net/Platform",
    headers: {
        "X-API-Key": process.env.BUNGIE_API_KEY,
        "User-Agent": "VexGate API/"+process.env.VERSION+" AppId/"+process.env.BUNGIE_CLIENT_ID
    }
};

module.exports = function () {
    let axiosBungie = axios.create(axiosBase);
    axiosBungie.interceptors.request.use(SetupRequest);
    axiosBungie.interceptors.response.use(HTMLInterceptor);
    return axiosBungie;
}