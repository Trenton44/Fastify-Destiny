const configs = {};
const fs = require("fs");

fs.readdirSync(__dirname+"/configs").forEach( (file) => {
    configs[path.parse(file).name] = require("./configs/"+file);
});

module.exports = function(endpoint){
    return configs[endpoint] ? configs[endpoint] : {};
}