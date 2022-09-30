const fs = require("fs");
const { exec } = require("child_process");
var manifest = require("./manifest.json");
var bungie = "https://www.bungie.net";

for (i in manifest.Response.jsonWorldContentPaths) {
  let path = manifest.Response.jsonWorldContentPaths[i];
  path = bungie + path;
  let savepath = __dirname + "/manifest/" + i;
  console.log("Pulling " + i + ": " + path);
  console.log("Saving to: " + savepath);
  exec("mkdir -p " + savepath);
  exec("curl " + path + " > " + savepath + "/world_content.json");
}

process.exit(0);
