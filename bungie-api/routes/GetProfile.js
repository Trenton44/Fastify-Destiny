export default {
    method: "GET",
    url: "/GetProfile",
    schema: {
        "query": {
            "type": "object",
            "required": ["components"],
            "properties":{
                "components": { 
                    "type": "array",
                    "uniqueItems": true,
                    "items": { 
                        "oneOf": [
                            { "type": "number" },
                            { "type": "string" }
                        ]
                    }
                },
                "sortBy": { "type": "string" }
            }
        }
    },
    handler: GET
}
/** The OpenAPI 3.0 location of this request */
const specuri = "/Destiny2/{membershipType}/Profile/{destinyMembershipId}/";


const defaultConfig = {
    "splice": true,
    "x-enum-reference": false,
    "Destiny.Responses.DestinyProfileResponse": {
        "x-mapped-definition": true,
        "group": {
            "characterdata": ["characters", "characterInventories", "characterProgressions", "characterRenderData", "characterActivities", "characterEquipment", "characterKiosks", "characterPlugSets", "characterPresentationNodes", "characterRecords", "characterCollectibles", "characterStringVariables", "characterCraftables", "characterCurrencyLookups"],
            "profiledata": ["profileInventory", "profileCurrencies", "profile", "platformSilver", "profileKiosks", "profilePlugSets", "profileProgression", "profilePresentationNodes", "profileRecords", "profileCollectibles", "profileTransitoryData", "profileStringVariables"]
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

/**
 * Handler for GET requests to the /GetProfile backend endpoint.
 * Requests data from bungie.net/GetProfile on behalf of authenticated user, and returns data
 * @param {FastifyRequest} request 
 * @param {FastifyReply} reply 
 * @returns {Object}
 */
async function GET(request, reply){
    let profile = request.session.user.activeProfile;
    let response = await request.BClient(specuri, {
        params: {
            membershipType: profile.membershipType,
            destinyMembershipId: profile.destinyMembershipId,
            components: request.query.components
        }
    });
    let Map = new request.BMap(response.data, "Destiny.Responses.DestinyProfileResponse");
    let data = Map.mapResponse(response, specuri, defaultConfig, { type: "get", code: 200, format: "application/json" });
    return reply.code(200).send(data);
};