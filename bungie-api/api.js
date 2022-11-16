const guide = require("./utils/json-traverse.js");
const getConfig = require("./configs/index.js");
const axios = require("axios");

const axiosbase = {
    baseURL: "https://www.bungie.net/Platform",
    headers: {
        "X-API-Key": process.env.BUNGIE_API_KEY,
        "User-Agent": "VexGate API/"+process.env.VERSION+" AppId/"+process.env.BUNGIE_CLIENT_ID
    }
};

function MapResponse(response, oalink, endpoint, userlang){
    let config = getConfig(endpoint);
    let respschema = guide.findPath(oalink);
    let data = new DataMap(config, userlang).map(response.data, respschema);
    return data;
}

function buildAPIRequest(){
    let axiosBungie = axios.create(axiosbase);
    axios.interceptors.response.use( (response) =>{
        return response.headers["content-type"] !== "application/json" ? Promise.reject("Bungie Service is currently unavailable") 
        : response.data.ErrorCode != 1 ? Promise.reject(response.data.ErrorStatus)
        : response;
    }, (error) =>{
        console.log("Request was rejected: ");
        console.log(error);
        return Promise.reject(error);
    });
    return axiosBungie;
}
module.exports = { MapResponse, buildAPIRequest };