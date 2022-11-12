
//Built-in libraries
const fs = require("fs");
require("dotenv").config({ path: ".env" });
const opts = require("./settings.js")[process.env.NODE_ENV];
if(!opts){ throw Error("No configuration for server environment found"); }

const server = require("./app.js")(opts, EnableCrossOrigin());

// Start the server, listening on port PORT_NUMBER
server.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);

function EnableCrossOrigin(){
    if(!process.env.ORIGIN)
        throw Error("Missing ORIGIN env variable.");
    return {
        origin: process.env.ORIGIN,
        methods: ["GET"],
        credentials: true,
        strictPreflight: true,
    };
}