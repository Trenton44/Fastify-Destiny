const fs = require("fs");
const https = require('https')
const { execSync } = require("child_process");
var manifest = require("./manifest.json");
var bungiepath = "https://www.bungie.net";

function asyncDownloadManifest(manifesturl, language, filename){
  console.log("Starting Download for Manifest: "+language);

  let filepath = __dirname + "/manifest/" + language;
  execSync("mkdir -p " + filepath);
  filepath = filepath+"/"+filename;

  https.get(manifesturl, (response) => {
    let file = fs.createWriteStream(filepath);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log("Finished Downloading "+language+": "+filepath);
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
    execSync("curl " + path + " > " + savepath + "/manifest.json", (error, stdout, stderr) => {
      if(error){
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }
}


for (i in manifest.Response.jsonWorldContentPaths){
  let urlpath = bungiepath + manifest.Response.jsonWorldContentPaths[i];
  asyncDownloadManifest(urlpath, i, "manifest.json");
}
