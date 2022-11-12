const schemas = {};
const fs = require("fs");
fs.readdirSync(__dirname+"/schemas").forEach( (file) => {
    schemas[file] = require("./schemas/"+file+".json");
});
module.exports = function(endpoint){
    let schema = schemas[endpoint];
    return schema ? schema : Error("Desired Schema was not found.");
};