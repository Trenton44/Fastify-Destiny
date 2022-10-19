let config = {
    "components": {
        "schemas": {
            "Destiny.Responses.DestinyProfileResponse": {
                "transform": function(data){ return data; },
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
                    return data;
                }
            },
            "Destiny.Definitions.DestinyInventoryItemDefinition":{
                "transform": function(data){
                    return data;
                }
            },
            "Destiny.Entities.Items.DestinyItemComponent":{
                "transform": function(data){
                    return data;
                }
            },

            //Destiny-Component-Type-Dependency transformations are located here
            "ProfileInventories":{
                "transform": function(data){
                    return data;
                }
            },
            
        }
    }
}

module.exports = config;