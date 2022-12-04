import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const manifests = require("./languages.json");
export default function(language) {
    let manifest = manifests[language] ? require(manifests[language]) : require(manifests["en"]);
    return manifest;
};