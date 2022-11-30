const axios = require("axios");
const BungieResponse = require("./api_response.js");

const HTMLInterceptor = (response) => {
    return response.headers["content-type"] !== "application/json" ? Promise.reject("Bungie Service is currently unavailable") 
        : response.data.ErrorCode != 1 ? Promise.reject(response.data.ErrorStatus)
        : response;
};

const axiosBungie = axios.create({
    baseURL: "https://www.bungie.net/Platform",
    headers: {
        "X-API-Key": process.env.BUNGIE_API_KEY,
        "User-Agent": "VexGate API/"+process.env.VERSION+" AppId/"+process.env.BUNGIE_CLIENT_ID
    }
});
axiosBungie.interceptors.response.use(HTMLInterceptor);

function InjectURIParameters(uri, parameters){
    for(let parameter in parameters)
        uri = uri.replace("{"+parameter+"}", parameters[parameter]);
    return uri;
}

module.exports = async (schemauri, parameters, language, token=null, config=null) => {
    let uri = InjectURIParameters(schemauri, parameters);
    let options = !token ? {} : { headers:{ "Authorization": "Bearer "+ token } };
    let data = await axiosBungie(uri, options).catch((error) => Promise.reject(error));
    return !config ? data : BungieResponse(data, schemauri, config, language);
}