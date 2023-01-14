
import https from "https";
import { mkdir, readFile, writeFile, access, constants } from "node:fs/promises";
import { fork } from "child_process";
import { URI } from "./mongodb_manifest.js";

const bungiepath = "https://www.bungie.net";
const openapiurl = "https://raw.githubusercontent.com/Bungie-net/api/master/openapi.json";
const bungiemanifesturl = "https://www.bungie.net/Platform/Destiny2/Manifest/";


const dirname = new URL("./", import.meta.url);


const readJSONFile = async (path) => JSON.parse(await readFile(path, { encoding: "utf8" }));
const fileExists = (path) => access(path, constants.R_OK | constants.W_OK)
.then(success => {
    console.log("file already exists. If you wish to redownload, please delete the file."); 
    return true;
});
const DownloadFile = (url, location) => new Promise((resolve, reject) => {
    console.log("Downloading "+url);
    let data = "";
    https.get(url, res => {
        res.setEncoding("utf8");
        console.log("recieved response, processing data...");
        res.on("data", d => data += d);
        res.on("end", () => resolve(writeFile(location, JSON.stringify(JSON.parse(data)))));
    })
    .on("error", (err) => reject(err));
});
const uploadManifestToDB = (url, collection, mongoURI) => new Promise((resolve, reject) => {
    console.log("Creating child process...");
    let childprocess = fork("./child.js", [ url, collection, mongoURI ], {}, error => {
        console.error(error);
        reject(childprocess);
    });
    childprocess.on("close", code => code == 0 ? resolve(code) : reject(childprocess));
    childprocess.on("error", err => {
        console.error(err);
        reject(childprocess);
    });
});


//Check for openapi.json file in current directory. If it doesn't exist, fetch it from Bungie.
console.log("Checking Bungie OpenAPI 3.0 Spec.");
await fileExists("openapi.json")
.catch(err => DownloadFile(openapiurl, dirname.pathname+"openapi.json"));

console.log("");

//Check for manifest file. If it doesn't exist, fetch it from Bungie.
console.log("Checking Bungie Manifest.");
await fileExists("manifest.json")
.catch(err => DownloadFile(bungiemanifesturl, dirname.pathname+"manifest.json"));

//load manifest file.
const manifest = await readJSONFile("./manifest.json");

/*
    Spin off child processes for each json content file within the manifest. (this is due to the amount of memory each manifest takes to load)
    Each child process will fetch and download the data, then upload it into a local mongodb collection
    One collection per language, so the "en" manifest data will be in the "en" collection.
*/
let downloads = [];
Object.entries(manifest.Response.jsonWorldContentPaths).forEach(([key, value]) => {
    downloads.push(uploadManifestToDB(bungiepath+value, key, URI).catch(child => child.kill(1)));
});
// wait for all child processes to finish uploading data to local mongodb 
await Promise.all(downloads);
console.log("Manifest data successfully loaded!");
process.exit(0);