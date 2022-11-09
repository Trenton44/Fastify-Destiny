const fp = require('fastify-plugin');
const DataMap = require("./map.js");
const D2API = require("./api.js");

async function myPlugin(app) {
  app.decorateRequest("MapResponse", null);
  app.decorateRequest("APIRequest", null);
  app.addHook('onRequest', async (req, reply) => {
    let language = req.session.userlanguage;
    console.log(language);
    if(!language){ language = "en"; }
    let manifest = require("./manifest/"+language+"/manifest.json");
    req.MapResponse = new DataMap(manifest);
    req.APIRequest = D2API;
  });
}

module.exports = fp(myPlugin);