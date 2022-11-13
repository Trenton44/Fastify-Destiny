const schemas = {};
const fs = require("fs");
fs.readdirSync(__dirname+"/schemas").forEach( (file) => {
    schemas[file] = require("./schemas/"+file+".json");
});
module.exports = schemas;