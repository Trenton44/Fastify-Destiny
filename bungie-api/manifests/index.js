const manifests = {};
const fs = require("fs");

fs.readdirSync(__dirname+"/manifest").forEach( (file) => {
    manifests[file] = require("./manifest/"+file+".json");
});
module.exports = function(language){
    return manifests[language] ? manifests[language] : manifests["en"];
};