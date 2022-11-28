const fs = require("fs");
const path = require("path");

const schemas = {};
fs.readdirSync(__dirname+"/schemas").forEach( (file) => {
    schemas[path.parse(file).name] = require("./schemas/"+file);
});

module.exports = schemas;