const guide = require("./json-traverse.js");
const CustomErrors = require("error-types.js");
const getConfig = require("./configs/index.js");

function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}

function ProcessResponse(response, oalink, endpoint, userlang){
    // TODO: check response type. if HTML, throw unavailable error
    if(response.type == "HTML")
        Promise.reject("Bungie API Service is currently unavailable");
    let config = getConfig(endpoint);
    let respschema = guide.findPathSchema(oalink);
    let data = new DataMap(config, userlang).map(response.data, respschema);


    // TODO: rework DataMap.js to take schema and response
}



module.exports = { InjectURIParameters, ProcessResponse };