//const d2_definitions = require("./manifest_files/en/jsonWorldContent.json"); 

//Note, transform_config functions cannot be used on properties that are basic types, like integer, string, etc. Rule of thumbs is objects and arrays only.
//Note: the dataMap looks for a "transform" property to use for data manipulation. 
//Also, any config objects created for the api have to match the object tree of the open api documentation. 
//So if you want to transform data in the SingleComponentResponseOfDestinyCharacterComponent, you would need the following object:
/* const obj = {
    "components": {
        "schemas": {
            "SingleComponentResponseOfDestinyCharacterComponent":{
                "transform": function(data){
                    //do data stuff here.
                }
            }
        }
    }
}
The transform keyword is required so that we can have subtrees with their own transformation functions.
 */

const transform_config = {
    components: {
        schemas: {},
        responses: {}
    },
    paths: {}
};

// You can build all of the functions in one giant tree if you like, i broke them down this way because it's easier for me to read.
let response_config = transform_config.components.responses;
let schema_config = transform_config.components.schemas;
let paths_config = transform_config.paths;

//breaking them down into subcategories and setting them in order.
schema_config["SingleComponentResponseOfDestinyCharacterComponent"] = {};
schema_config["SingleComponentResponseOfDestinyCharacterComponent"].transform = function(data){ return data.data; }


schema_config["Destiny.Entities.Characters.DestinyCharacterComponent"] = {};
schema_config["Destiny.Entities.Characters.DestinyCharacterComponent"].transform = function(data) {
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

module.exports = transform_config;