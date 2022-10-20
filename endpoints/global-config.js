
/**
 * 
 * @param { Object[] } data 
 * @param { string } key 
 * @returns { Object.<key, array> }
 */
function sortArrayByKey(data, sortkey){
    let obj = {};
    data.forEach( (element) => {
        let key = element[sortkey];
        if(!obj[key])
            obj[key] = [];
        obj[key].push(element);
    })
    return obj;
}



let config = {
    "x-mapped-definition": true, //must be true/false. if true, map hashes to their definitions
    "x-enum-values": true, //must be true/false. if true, returns the "numericValue" of the enum. if false, returns the "identifier" (that's how the bungie api stores these. it will return identifier if null) 
    "components": {
        "schemas": {
            "User.UserMembershipData": {
                "transform": function(data){
                    let obj = {};
                    data.destinyMemberships.forEach( (element) => { obj[element.membershipId] = element; });
                    data.destinyMemberships = obj;
                    return data;
                }
            },
            "SingleComponentResponseOfDestinyVendorReceiptsComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyInventoryComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyProfileComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyPlatformSilverComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyKiosksComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyPlugSetsComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyProfileProgressionComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyPresentationNodesComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyProfileRecordsComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyProfileCollectiblesComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyProfileTransitoryComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyMetricsComponent":{ "transform": function(data) { return data.data; } },
            "SingleComponentResponseOfDestinyStringVariablesComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCharacterComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyInventoryComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCharacterProgressionComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCharacterRenderComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCharacterActivitiesComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyInventoryComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyKiosksComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyPlugSetsComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyPresentationNodesComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCharacterRecordsComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCollectiblesComponent":{ "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyStringVariablesComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCraftablesComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyCurrenciesComponent": { "transform": function(data) { return data.data; } },
            "Destiny.Entities.Inventory.DestinyInventoryComponent": { "transform": function(data){ return data.items; } },
            "DictionaryComponentResponseOfint64AndDestinyItemRenderComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemStatsComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemSocketsComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemReusablePlugsComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemPlugObjectivesComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemTalentGridComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfuint32AndDestinyItemPlugComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemObjectivesComponent": { "transform": function(data) { return data.data; } },
            "DictionaryComponentResponseOfint64AndDestinyItemPerksComponent": { "transform": function(data) { return data.data; } },
        }
    }
}

module.exports = { config, sortArrayByKey, };