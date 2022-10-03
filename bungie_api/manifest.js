const fs = require("fs");
const { exec, execSync } = require("child_process");
var manifest = require("./manifest.json");
const { Console } = require("console");
var bungie = "https://www.bungie.net";

let promises = [];
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
  //promises.push(request);
  //console.log("next up: "+manifest.Response.jsonWorldContentPaths[i+1]);
}

Promise.all(promises)
.then( (result) => {
  console.log("Completed.");
  process.exit(0);
} )
.catch( (error) => console.error(error) );
