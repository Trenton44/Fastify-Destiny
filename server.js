
//Built-in libraries
require("dotenv").config({ path: ".env" });
const opts = require("./settings.js")(process.env.NODE_ENV);

const server = require("./app.js")(opts);

// Start the server, listening on port PORT_NUMBER
server.listen(
    { port: process.env.PORT_NUMBER, host: process.env.HOST },
    function (error, address) { if (error) { console.log(error); process.exit(1); } }
);

