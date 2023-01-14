import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { createWriteStream } from "fs";
import JSONMap from "./utils/JsonMap.js";
import https from "https";
import { connect } from "./data/manifest_mongodb_server.js";
import { countReset } from "node:console";

const manifestDB = await connect();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dirname = new URL("./data/", import.meta.url);
const bungiepath = "https://www.bungie.net";
const openapiurl = "https://raw.githubusercontent.com/Bungie-net/api/master/openapi.json";
const bungiemanifesturl = "https://www.bungie.net/Platform/Destiny2/Manifest/";

await mkdir(dirname.pathname+"manifests/", { recursive: true });
console.log("Downloading Bungie OpenAPI 3.0 Spec.");
//execSync("curl "+openapiurl+" > "+dirname.pathname+"openapi.json");
console.log("Downloading Bungie Manifest.");
//execSync("curl "+bungiemanifesturl+" > "+dirname.pathname+"manifest.json");

const { default: manifest } = await import("./data/manifest.json", { assert: { type: "json" } });
const manifestFolder = new URL("./data/manifests/", import.meta.url);
let supportedlanguages = {};

const readJSONFile = async (path) => JSON.parse(await readFile(path, { encoding: "utf8" }));
const writeJSONData = async (path, name, data) => {
    //console.log("writing "+data+" to "+path+"/"+name);
    await mkdir(path, { recursive: true });
    await writeFile(path+"/"+name, JSON.stringify({ data: data }));
    //console.log("Successfully written "+data+" to "+path+"/"+name);
    return true;
};

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

const FetchManifests = async () => {
    console.log("Downloading Manifest files to "+manifestFolder.pathname);
    let manifestDownloads = [];
    Object.entries(manifest.Response.jsonWorldContentPaths).forEach( ([key, value]) => {
        let filelocation = manifestFolder.pathname + key + ".json";
        console.log("Starting Download: "+key);
        manifestDownloads.push(DownloadFile(bungiepath + value, filelocation).then( (file) => FileHandlers(file, key, filelocation)));
    });
    
    await Promise.all(manifestDownloads);
    console.log("=================================");
    console.log("Successfully downloaded all files.");
    console.log("Updating supported languages.");
    await writeFile(dirname.pathname+"languages.json", JSON.stringify(supportedlanguages)).catch( error => Promise.reject(error));
    console.log("Supported languages list successfully updated.");
    return true;
};

const MapJSONData = async () =>{
    let languages = await readJSONFile(dirname.pathname+"languages.json");
    console.log("unpacking manifest files.");
    console.log("flat-mapping manifest data to files. This will take awhile.");
    let data = null;
    for(let lang in languages){
        console.log(process.memoryUsage());
        await sleep(10000);
        console.log("mapping "+lang+" dataset.");
        data = await readJSONFile(languages[lang]);
        let flat = new JSONMap(data);
        flat = flat.generate("", flat.obj);
        let next = flat.next();
        console.log("Mapping "+dirname.pathname+"manifests/"+lang);
        while(!next.done){
            let pathdir = next.value[0].split("/");
            let name = pathdir.pop();
            pathdir = pathdir.join("/");
            await writeJSONData(dirname.pathname+"manifests/"+lang+pathdir, name+".json", next.value[1]);
            next = flat.next();
        }
        console.log("Finished Mapping "+dirname.pathname+"manifests/"+lang);
        data = null;
        console.log(process.memoryUsage());
        await sleep(30000);
    }
};

const print = async (counter) => {
    while(counter.num !== -1){
        console.log(counter.num);
        await sleep(3000);
    }
    return true;
};
const UpdateDB = async () => {
    let languages = await readJSONFile(dirname.pathname+"languages.json");
    for(let language in languages){
        console.log(process.memoryUsage());
        console.log("Parsing: "+language);
        let collection = await manifestDB.collection(language);
        console.log(process.memoryUsage());
        let flat = new JSONMap(await readJSONFile(languages[language]));
        flat = flat.generate("", flat.obj);
        let next = flat.next();
        let counter = {num:0};
        print(counter);
        while(!next.done){
            //await writeJSONData(dirname.pathname+"manifests/"+lang+pathdir, name+".json", next.value[1]);
            await collection.insertOne({
                _id: next.value[0],
                value: next.value[1]
            });
            next = flat.next();
            counter.num += 1;
        }
        counter.num = -1;
    }
    return true;
};

//await FetchManifests();

//await MapJSONData();
//await UpdateDB();
console.log("here");
let collection = await manifestDB.collection("en");
const data = await collection.find({ _id: "/DestinyNodeStepSummaryDefinition/71216177/displayProperties/hasIcon" }).toArray();
console.log("here");
for(let i in data){
    console.log(i);
    console.log(data[i]);
    await sleep(1000);
}
console.log("Completed Environment Setup!");
process.exit(0);