const fs = require("fs");
const { exec, execSync } = require("child_process");
var manifest = require("./manifest.json");
const { Console } = require("console");
var bungie = "https://www.bungie.net";

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

