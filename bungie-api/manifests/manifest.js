const fs = require("fs");
const { execSync } = require("child_process");
const https = require("https");

const manifest = require("./manifest.json");
let supportedlanguages = {};

const filepath = __dirname+"/manifest";
const bungiepath = "https://www.bungie.net";

execSync("mkdir -p "+filepath);


function asyncDownloadManifest(url, language){
    return new Promise((resolve, reject) => {
        console.log("Downloading Manifest "+language);
        let fileloc = filepath+"/"+language+".json";
        https.get(url, (response) => {
            let file = fs.createWriteStream(fileloc);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log("Successfully Downloaded "+language+": "+fileloc);
                supportedlanguages[language] = fileloc;
                resolve(true);
            });
        }).on("error", (err) => reject(err));
    });
}
let downloads = [];
for (i in manifest.Response.jsonWorldContentPaths){
    let urlpath = bungiepath + manifest.Response.jsonWorldContentPaths[i];
    downloads.push(asyncDownloadManifest(urlpath, i));
}
Promise.all(downloads).then( (result) => {
    console.log("Successfully downloaded all files.");
    fs.writeFile("languages.json", JSON.stringify(supportedlanguages), (err) => console.log("Success!"));
});