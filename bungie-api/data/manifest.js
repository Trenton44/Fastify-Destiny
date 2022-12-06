import { readFile } from "node:fs/promises";
import languages from "./languages.json" assert { type: "json" };
/*
For now, loading all manifests into memory takes ~4GB, which isn't feasible
plan is to load these into seperate mongodb using mongoimport/export and make specific requests from there.
For now, only load "en" manifest.
let manifests = {};

async function loadManifests(){
    for(let key in languages){
        manifests[key] = await readFile(new URL("./manifests/"+key+".json", import.meta.url), { encoding: "utf8" });
    }
}*/
const manifest = await readFile(new URL("./manifests/en.json", import.meta.url), { encoding: "utf8" });
export default manifest;