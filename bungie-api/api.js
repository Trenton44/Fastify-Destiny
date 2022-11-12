const guide = require("./json-controller.js");
const CustomErrors = require("error_types.js");

function InjectURIParameters(uri, params){
    for(parameter in params)
        uri = uri.replace("{"+parameter+"}", params[parameter]);
    return uri;
}

function ProcessResponse(response, oalink){
    // TODO: check response type. if HTML, throw unavailable error
    let respschema = guide.findPathSchema(oalink);
    if(!respschema){ throw Error("unable to find a schema for this endpoint."); }
    // TODO: rework DataMap.js to take schema and response
}

module.exports = { InjectURIParameters, ProcessResponse };