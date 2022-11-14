const guide = require("./json-traverse.js");
const CustomErrors = require("error-types.js");
const getConfig = require("./configs/index.js");

function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}

function MapResponse(response, oalink, endpoint, userlang){
    let config = getConfig(endpoint);
    let respschema = guide.findPathSchema(oalink);
    let data = new DataMap(config, userlang).map(response.data, respschema);
    return data;
}

module.exports = { InjectURIParameters, ProcessResponse };