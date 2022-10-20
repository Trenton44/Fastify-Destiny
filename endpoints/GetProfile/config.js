const standard_config = require("../global-config.js").config;

/**
 * @function combineObjectsByKeys
 * @description Takes an object and inverses it's keys with the keys their children, combining the data based on the child keys
 * This should really only be used to combine objects where the keys are KNOWN to line up, like Destiny.DestinyComponentType characterInventories, characterEquipment, characterRenderData, etc..
 * @param { Object } 
 */
function combineObjectsByKeys(obj){
    let result = {};
    for(i in obj){
        let keys = Object.keys(obj[i]);
        keys.forEach( (key) => {
            if(!result[key])
                result[key] = {};
            result[key][i] = obj[i][key];
        });
    }
}

standard_config.components.schemas["Destiny.Responses.DestinyProfileResponse"] = {

}

standard_config.components.schemas["ProfileInventories"] = {

};


module.exports = standard_config;