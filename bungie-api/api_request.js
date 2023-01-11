import { default as axios } from "axios";

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

/**
 * Interceptor for axios responses from bungie.net
 * Validates that incoming response is not HTML, which indicates that the API may be offline
 * @param {FastifyResponse} response 
 * @returns 
 */
const HTMLInterceptor = (response) => {
    return response.headers["content-type"] !== "application/json; charset=utf-8" ? Promise.reject("Bungie Service is currently unavailable") 
    : response.data.ErrorCode != 1 ? Promise.reject(response.data.ErrorStatus)
    : response;
};

/**
 * Transforms an OpenAPI url to a proper bungie.net endpoint url, given the correct parameters
 * @param {AxiosInstance} request 
 * @returns {AxiosInstance}
 */
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

/**
 * Creates a base axios instance for request, to make requests to bungie.net API
 * @returns {AxiosInstance}
 */
export default function() {
    let axiosBungie = axios.create(axiosBase);
    axiosBungie.interceptors.request.use(SetupRequest);
    axiosBungie.interceptors.response.use(HTMLInterceptor);
    return axiosBungie;
}