const guide = require("./utils/json-traverse.js");
const getConfig = require("./configs/index.js");

function MapResponse(response, oalink, endpoint, userlang){
    let config = getConfig(endpoint);
    let respschema = guide.findPathSchema(oalink);
    let data = new DataMap(config, userlang).map(response.data, respschema);
    return data;
}

module.exports = MapResponse;