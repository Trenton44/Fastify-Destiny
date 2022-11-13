const fs = require("fs");
const schemas = {};

fs.readdirSync(__dirname+"/schemas").forEach( (file) => {
    schemas[file] = require("./schemas/"+file+".json");
});

module.exports = schemas;