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
    "components": {
        "schemas": {
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
        }
    }
};


const api = new SwaggerMap(API);
const data = new JSONMap(userdata);
const config = new ConfigMap(defaultConfig);
config.addTransformation("filter", keywords.filter);
config.addTransformation("group", keywords.group);
console.time("beans");
const flatapi = api.flatten();
let flatdata = data.flatten();
//const flatconfig = config.flatten();
//await fs.writeFile(dirname.pathname+"before.json", JSON.stringify(flatdata)).catch( error => Promise.reject(error));
for(let key in flatapi){
    let schemadata = Object.keys(flatdata).filter(dkey => dkey.match(key));
    if(schemadata.length == 0)
        continue;
    let options = config.buildOptions(flatapi[key].ref);
    for(let skey of schemadata){
        Object.entries(options).forEach(([ckey, value]) => {
            if(!config.transform[ckey])
                return null;
            flatdata = config.transform[ckey](flatdata, flatapi, skey, key, value);
        });
    }
    /*
        Consider:
        After a subtree is completed, have a function that:
            -inflates all of them into an object.
            -deletes the flat versions after conversion to object.
        That way, behavior wise, we can have the custom functions treat subnodes as objects, 
        instead of regex searching the same uri's over and over as you go up the tree
    */
}
let inflateddata = data.inflate(flatdata);
console.timeEnd("beans");
//await fs.writeFile(dirname.pathname+"after.json", JSON.stringify(flatdata)).catch( error => Promise.reject(error));
//await fs.writeFile(dirname.pathname+"finished.json", JSON.stringify(inflateddata)).catch( error => Promise.reject(error));
