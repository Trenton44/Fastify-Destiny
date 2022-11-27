const guide = require("./utils/json-traverse.js");
const getConfig = require("./configs/index.js");

module.exports = (response, openAPILink, endpoint, userlanguage) => {
    let config = getConfig(endpoint);
    let respschema = guide.findPath(oalink);
    let data = new DataMap(config, userlang).map(response.data, respschema);
    return data;
}