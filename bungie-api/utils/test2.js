import fs from "node:fs/promises";
import userdata from "../../env-files/profileData.json" assert { type: "json" };
import API from "../data/openapi.json" assert { type: "json" };

import JSONMap from "./JsonMap.js";
import ConfigMap from "./ConfigMap.js";
import SwaggerMap from "./SwaggerMap.js";
import keywords from "./customkeywords.js";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dirname = new URL("./", import.meta.url);

const defaultConfig = {
    "splice": true,
    "x-enum-reference": false,
    "Destiny.Responses.DestinyProfileResponse": {
        "x-mapped-definition": true,
        "group": {
            "characterdata": ["characters", "characterInventories", "characterProgressions", "characterRenderData", "characterActivities", "characterEquipment", "characterKiosks", "characterPlugSets", "characterPresentationNodes", "characterRecords", "characterCollectibles", "characterStringVariables", "characterCraftables", "characterCurrencyLookups"],
            "profiledata": ["profileInventory", "profileCurrencies", "profile", "platformSilver", "profileKiosks", "profilePlugSets", "profileProgression", "profilePresentationNodes", "profileRecords", "profileCollectibles", "profileTransitoryData", "profileStringVariables"]
        },
        "profileInventory": {
            "data": { "x-mapped-definition": true }
        }
    },
    "Destiny.Entities.Inventory.DestinyInventoryComponent": { "link": "key" },
    "Destiny.Entities.Characters.DestinyCharacterComponent": { "link": "key" },
    "Destiny.Entities.Characters.DestinyCharacterRenderComponent": { "link": "key" },
    "Destiny.Entities.Items.DestinyItemComponent": 
        { "filter": ["itemHash", "bucketHash", "itemHashMapped", "bucketHashMapped"] },
    "SingleComponentResponseOfDestinyInventoryComponent": 
        { "x-mapped-definition": false },
};


const api = new SwaggerMap(API);
const data = new JSONMap(userdata);
const config = new ConfigMap(defaultConfig);
config.addTransformation("filter", keywords.filter);
config.addTransformation("group", keywords.group);
config.addTransformation("x-enum-reference", keywords["x-enum-reference"]);
console.time("beans");
// TODO: Move .flatten to occur on instance construction, and then make it accessible.
// this way, i can pass the instance obj instead of just the flatmap to the custom keywords, which lets me use the flat OR original obj
// use the .locate function with x-enum-reference to find the enum schema, and return the desired value based on options value.
const flatapi = api.flatten();
let flatdata = data.flatten();
let flatkeys = Object.keys(flatdata).toString();
const flatconfig = config.flatten();
await fs.writeFile(dirname.pathname+"api.json", JSON.stringify(flatapi)).catch( error => Promise.reject(error));
for(let key in flatapi){
    let iter = flatkeys.matchAll(key+"(?=,)"); //ending regex searches for , delimiter created between keys by Array.toString();
    let next = iter.next();
    if(next.done)
        continue;
    // rewrite to use ref array instead of just one ref string.
    let baseconfig = flatapi[key].ref[0].split("/");
    let refUri = flatapi[key].ref.slice(0);
    refUri[0] = refUri[0].split("/")[0];
    while(!next.done){
        for(let index in refUri){
            let options = {};
            // search for any direct data properties configured in the config. these take precedence
            try {
                options = config.locate(baseconfig.slice(0, index));
            }
            catch{
                // if none, look for a config using the data's schema $ref.
                //console.log("No direct data config here to override, searching for ref config.");
                try{ options = config.locate(refUri[index]); }
                catch{
                    // if no config, nothing to be done, move to the next in the list.
                    //console.log("No $ref config for this data, moving to next."); 
                    continue; 
                }
            }
            for(let optkey in options){
                if(!config.transform[optkey])
                    continue;
                config.transform[optkey](flatdata, flatapi, next.value[0], key, options[optkey], index - 1);
            }
        }
        next = iter.next();
    }
    //flatkeys.replaceAll(key+"(?=,)", "");
    //console.log(flatkeys.length);
}
let inflateddata = data.inflate(flatdata);
console.timeEnd("beans");
//await fs.writeFile(dirname.pathname+"after.json", JSON.stringify(flatdata)).catch( error => Promise.reject(error));
await fs.writeFile(dirname.pathname+"finished.json", JSON.stringify(inflateddata)).catch( error => Promise.reject(error));
/*
    Consider:
    After a subtree is completed, have a function that:
        -inflates all of them into an object.
        -deletes the flat versions after conversion to object.
    That way, behavior wise, we can have the custom functions treat subnodes as objects, 
    instead of regex searching the same uri's over and over as you go up the tree
*/