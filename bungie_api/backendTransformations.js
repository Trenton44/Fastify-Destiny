// each variable in this file is set to the desired response format of a given endpoint.
const d2_definitions = require("./manifest/en/world_content.json"); 

const bungie_root = "https://www.bungie.net";

let config = {
    "components": {
        "schemas": {
            "Destiny.Responses.DestinyProfileResponse": {
                "transform": function(data){
                    let ids = data.profile.characterIds;
                    //move all character-specifc info into .characters["character"].
                    for(i in ids){
                        let char_store = data.characters[ids[i]];
                        char_store.equipment_data = data.characterEquipment[ids[i]].items;
                        char_store.inventory_data = data.characterInventories[ids[i]].items;
                        char_store.render_data = data.characterRenderData[ids[i]];
                    }

                    //delete now useless duplicate 
                    delete(data.characterEquipment);
                    delete(data.characterInventories);
                    delete(data.characterRenderData);
                    
                    data.profile_data = {
                        gamertag: data.profile.userInfo.bungieGlobalDisplayName + "#" + data.profile.userInfo.bungieGlobalDisplayNameCode,
                        last_played: data.profile.dateLastPlayed,
                        currencies: data.profileCurrencies.items,
                        inventory: data.profileInventory.items
                    };
                    return data;
                },
                "profileInventory": {
                    "transform": function(data){
                        return data;
                    }
                }
            },
            "SingleComponentResponseOfDestinyVendorReceiptsComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyInventoryComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyProfileComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyPlatformSilverComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyKiosksComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyPlugSetsComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyProfileProgressionComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyPresentationNodesComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyProfileRecordsComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyProfileCollectiblesComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyProfileTransitoryComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyMetricsComponent": {
                "transform": function(data) { return data.data; }
            },
            "SingleComponentResponseOfDestinyStringVariablesComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCharacterComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyInventoryComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCharacterProgressionComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCharacterRenderComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCharacterActivitiesComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyInventoryComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyKiosksComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyPlugSetsComponent": {
                "transform": function(data) { return data.data; }
            },
            "DestinyBaseItemComponentSetOfuint32": {
                "transform": function(data) { return data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyPresentationNodesComponent": {
                "transform": function(data) { return data.data; }
            }, 
            "DictionaryComponentResponseOfint64AndDestinyCharacterRecordsComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCollectiblesComponent": {
                "transform": function(data) { return data.data; }
            }, 
            "DictionaryComponentResponseOfint64AndDestinyStringVariablesComponent": {
                "transform": function(data) { return data.data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCraftablesComponent": {
                "transform": function(data) { return data.data; }
            },
            "DestinyItemComponentSetOfint64": {
                "transform": function(data) { return data; }
            },
            "DictionaryComponentResponseOfint64AndDestinyCurrenciesComponent": {
                "transform": function(data) { return data.data; }
            },
            "Destiny.Entities.Inventory.DestinyInventoryComponent":{
                "transform": function(data){ return data.items; }
            },
            "Destiny.Entities.Characters.DestinyCharacterComponent":{
                "transform": function(data){
                    let altered_stats = {};
                    for(i in data.stats){
                        let stat_def = d2_definitions.DestinyStatDefinition[i];
                        altered_stats[stat_def.displayProperties.name] = data.stats[i];
                    }
                    data.stats = altered_stats;
                    data.race_data = d2_definitions.DestinyRaceDefinition[data.raceHash];
                    data.gender_data = d2_definitions.DestinyGenderDefinition[data.genderHash];
                    data.class_data = d2_definitions.DestinyClassDefinition[data.classHash];
                    data.emblem_data = {
                        path: bungie_root+data.emblemPath,
                        background_path: bungie_root+data.emblemBackgroundPath,
                        hash: data.emblemHash, //Note, this maps to DestinyInventoryItemDefinition, will need to come back to this later.
                        colors: data.emblemColor,
                    };
                    if(data.titleRecordHash){
                        data.title_data = d2_definitions.DestinyRecordDefinition[data.titleRecordHash];
                    }
                    return data;
                }
            },
            "Destiny.Entities.Items.DestinyItemComponent":{
                "transform": function(data){
                    data.item_hash_data = d2_definitions.DestinyInventoryItemDefinition[data.itemHash];
                    data.style_override = d2_definitions.DestinyInventoryItemDefinition[data.overrideStyleItemHash];
                    data.bucket_hash_data = d2_definitions.DestinyInventoryBucketDefinition[data.bucketHash];
                    data.metric_data = d2_definitions.DestinyMetricDefinition[data.metricHash];
                    return data;
                }
            }
        }
    }
}

module.exports = config;