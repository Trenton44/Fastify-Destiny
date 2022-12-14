import fs from "node:fs/promises";

import userdata from "../../env-files/profileData.json" assert { type: "json" };
import DataMap from "./DataMap.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const dirname = new URL("./", import.meta.url);

const defaultConfig = {
    "splice": true,
    "x-enum-reference": true,
    "Destiny.Responses.DestinyProfileResponse": {
        "group": {
            "characterdata": ["characters", "characterInventories", "characterProgressions", "characterRenderData", "characterActivities", "characterEquipment", "characterKiosks", "characterPlugSets", "characterPresentationNodes", "characterRecords", "characterCollectibles", "characterStringVariables", "characterCraftables", "characterCurrencyLookups"],
            "profiledata": ["profileInventory", "profileCurrencies", "profile", "platformSilver", "profileKiosks", "profilePlugSets", "profileProgression", "profilePresentationNodes", "profileRecords", "profileCollectibles", "profileTransitoryData", "profileStringVariables"]
        }
    },
    "Destiny.Entities.Inventory.DestinyInventoryComponent": { "link": "key" },
    "Destiny.Entities.Characters.DestinyCharacterComponent": { "link": "key" },
    "Destiny.Entities.Characters.DestinyCharacterRenderComponent": { "link": "key" },
    "Destiny.Entities.Items.DestinyItemComponent":{ 
        "filter": ["itemHash", "bucketHash", "itemHashMapped", "bucketHashMapped"],
        "x-enum-reference": true
    },
};

const datamap = new DataMap(userdata, defaultConfig);
const data = datamap.map();
await fs.writeFile(dirname.pathname+"data.json", JSON.stringify(data[0])).catch( error => Promise.reject(error));
await fs.writeFile(dirname.pathname+"residual.json", JSON.stringify(data[1])).catch( error => Promise.reject(error));