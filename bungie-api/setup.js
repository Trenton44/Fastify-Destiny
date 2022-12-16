import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import { createWriteStream } from "fs";
import JSONMap from "./utils/JsonMap.js";
import https from "https";
const bungiepath = "https://www.bungie.net";

const dirname = new URL("./data/", import.meta.url);
console.log("Downloading Bungie OpenAPI 3.0 Spec.");
execSync("curl https://raw.githubusercontent.com/Bungie-net/api/master/openapi.json > "+dirname.pathname+"openapi.json");
console.log("Downloading Bungie Manifest.");
execSync("curl https://www.bungie.net/Platform/Destiny2/Manifest/ > "+dirname.pathname+"manifest.json");

const { default: manifest } = await import("./data/manifest.json", { assert: { type: "json" } });
const manifestFolder = new URL("./data/manifests/", import.meta.url);
let supportedlanguages = {};
let manifestDownloads = [];

const DownloadFile = (url, location) => new Promise((resolve, reject) => {
    https.get(url, data => {
        let file = createWriteStream(location);
        data.pipe(file);
        resolve(file);
    })
    .on("error", (err) => reject(err));
});

const FileHandlers = (file, key, filelocation) => new Promise((resolve, reject) => {
    file.on("finish", () => {
        file.close();
        console.log("Successfully Downloaded "+key + " => " +filelocation);
        supportedlanguages[key] = filelocation;
        resolve();
    });
    file.on("error", () => reject("Unable to write to file "+filelocation));
});

console.log("Downloading Manifest files to "+manifestFolder.pathname);

Object.entries(manifest.Response.jsonWorldContentPaths).forEach( ([key, value]) => {
    let filelocation = manifestFolder.pathname + key + ".json";
    console.log("Starting Download: "+key);
    manifestDownloads.push(DownloadFile(bungiepath + value, filelocation).then( (file) => FileHandlers(file, key, filelocation)));
});

console.log("=================================");

Promise.all(manifestDownloads).then( async (result) => {
    console.log("=================================");
    console.log("Successfully downloaded all files.");
    console.log("Updating supported languages.");
    await fs.writeFile(dirname.pathname+"languages.json", JSON.stringify(supportedlanguages)).catch( error => Promise.reject(error));
    console.log("unpacking manifest files.");
    console.log("flat-mapping manifest data to files. This will take awhile.");
    for(let lang in supportedlanguages){
        console.log("mapping "+lang+" dataset.");
        let data = await import(supportedlanguages[lang], { assert: { type: "json" }});
        let flat = new JSONMap(data).flatten();
        
        for(let key in flat){
            let temp = key.split("/");
            temp.shift();
            temp = temp.join(".");
            await fs.mkdir(dirname.pathname+"manifests"+"/"+lang, { recursive: true });
            await fs.writeFile(dirname.pathname+"manifests"+"/"+lang+"/"+temp+".json", JSON.stringify(flat[key])).catch( error => Promise.reject(error));
        }
    }
    console.log("Supported languages list successfully updated.");
    console.log("Completed Environment Setup!");
});