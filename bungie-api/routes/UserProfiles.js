export default { 
    get: {
        method: "GET",
        url: "/UserProfiles",
        schema: {},
        handler: GET
    }, 
    post: {
        method: "POST",
        url: "/UserProfiles",
        schema: {
            "query": { 
                "type": "object",
                "required": ["id"],
                "properties": {
                    "id": { "type": "integer" }
                }
            }
        },
        handler: POST
    }
};

function GET(request, reply){}
function POST(request, reply){}