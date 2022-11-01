const path = require("path");
const configuration = require("./config");

const schema = require("./schema.json");
const guide = require("../../bungie-api/json-schema-controller.json");
async function getDefinition(request, reply){
    let manifest = require("../../bungie-api/manifest/"+request.session.userlanguage+"/manifest.json");
    // take definition requested from query,
    //guide.traverseObject();
}
let GetDefinition = (fastify, options, next) => {
    fastify.get("/Definition", getDefinition)
}