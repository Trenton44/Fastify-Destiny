import { mkdir, readFile, writeFile } from "node:fs/promises";
import languages from "./languages.json" assert { type: "json" };

function loadData(keys, language="en"){
    keys.split("/");
    keys.shift();
    keys = keys.join(".");
    let data = null;
    try{ data = readFileSync(new URL("./manifests/"+language+"/"+keys+".json", import.meta.url), { encoding: "utf8" }); }
    catch{ data = null; }
    return data;
}
export default loadData;