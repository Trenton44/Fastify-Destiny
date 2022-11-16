const manifests = require("./languages.json");
const { accessSync, constants } = require("fs");
const path = require("path");

module.exports = (language) => {
    //console.time("manifest retrieval");
    let manifest = manifests[language] ? require(manifests[language]) : require(manifests["en"]);
    //console.timeEnd("manifest retrieval");
    return manifest;
};