
//Built-in libraries
const fs = require("fs");
require("dotenv").config({ path: ".env" });
const { trustProxy, logger, cookie } = require("./settings.js")[process.env.NODE_ENV];

// initialize the cors options to false
let corsopts = false;
//if an env variable ORIGIN exists, enable CORS with ORIGIN
if(process.env.ORIGIN){
    corsopts = {
        origin: process.env.ORIGIN,
        methods: ["GET"],
        credentials: true,
        strictPreflight: true,
    };
}

// create the fastify server using the given options
/**
 * 
 */
const server = require("./app.js")({
    logger: logger, // if true, default fastify logger. also supports pino-transport for logging
    // https is required for Destiny 2 API, so it is explicitly declared here in server.js, instead of settings.js
    https: {
      allowHTTP1: true,
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    },
    trustProxy: trustProxy
}, cookie, corsopts);

// Start the server, listening on port PORT_NUMBER
server.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);