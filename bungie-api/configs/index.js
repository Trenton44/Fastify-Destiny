const configs = {};
const fs = require("fs");

fs.readdirSync(__dirname+"/configs").forEach( (file) => {
    configs[file] = require("./configs/"+file+".json");
});

module.exports = function(endpoint){
    return configs[endpoint] ? configs[endpoint] : {};
}