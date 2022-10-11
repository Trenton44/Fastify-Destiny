const fs = require("fs");
const https = require('https')
const { exec, execSync } = require("child_process");
var manifest = require("./manifest.json");
const { Console } = require("console");
var bungie = "https://www.bungie.net";
var bungiepath = "https://www.bungie.net";

function asyncDownloadManifest(manifest_url, manifest_lang, filename){
  console.log("Starting Download for Manifest: "+manifest_lang);

  let filepath = __dirname + "/manifest/" + manifest_lang;
  execSync("mkdir -p " + filepath);
  filepath = filepath+"/"+filename;

  https.get(manifest_url, (response) => {
    let file = fs.createWriteStream(filepath);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log("Finished Downloading "+manifest_lang+": "+filepath);
    })
  });
}

//Keeping as a backup, but async is much faster.
function DownloadManifest(){
  for (i in manifest.Response.jsonWorldContentPaths) {
    let path = manifest.Response.jsonWorldContentPaths[i];
    path = bungie + path;
    let savepath = __dirname + "/manifest/" + i;
    console.log("Pulling " + i + ": " + path);
    console.log("Saving to: " + savepath);
    execSync("mkdir -p " + savepath);
    execSync("curl " + path + " > " + savepath + "/world_content.json", (error, stdout, stderr) => {
      if(error){
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }
}

console.log(manifest.messageStatus);
for (i in manifest.Response.jsonWorldContentPaths){
  let urlpath = bungiepath + manifest.Response.jsonWorldContentPaths[i];
  asyncDownloadManifest(urlpath, i, "world_content.json");
}
