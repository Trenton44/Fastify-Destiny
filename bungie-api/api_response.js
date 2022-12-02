const guide = require("./utils/json-traverse.js");

module.exports = function(data, uri, config, language){
    if(!config || !data || !uri)
        throw Error("You need to pass the required arguments.");
    let respschema = guide.findPath(oalink);
    return config == {} ? data : new DataMap(config, userlang).map(response.data, respschema);
}