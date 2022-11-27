const axios = require("axios");

const axiosbase = {
    baseURL: "https://www.bungie.net/Platform",
    headers: {
        "X-API-Key": process.env.BUNGIE_API_KEY,
        "User-Agent": "VexGate API/"+process.env.VERSION+" AppId/"+process.env.BUNGIE_CLIENT_ID
    }
};

const interceptHTML = (response) => {
    return response.headers["content-type"] !== "application/json" ? Promise.reject("Bungie Service is currently unavailable") 
        : response.data.ErrorCode != 1 ? Promise.reject(response.data.ErrorStatus)
        : response;
};

module.exports = () => {
    let axiosBungie = axios.create(axiosbase);
    axiosBungie.interceptors.response.use(interceptHTML);
    return axiosBungie;
};