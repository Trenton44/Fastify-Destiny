
//Built-in libraries
require("dotenv").config({ path: ".env" });

const opts = require("./settings.js")(process.env.NODE_ENV);

// spin up a local mongodb database for development purposes
if(process.env.NODE_ENV == "development"){
    require("./localdb.js").then( (db) => {
        process.env.MONGO_DB_URL = db.getUri();
        let host = startServer();
        host.addHook("onClose", () => db.stop());
    })
    .catch( error => error);
}
else{ startServer(); }

// Start the server, listening on port PORT_NUMBER
function startServer(){
    server = require("./app.js")(opts);
    console.log("Starting server.");
    server.listen({ 
        port: process.env.PORT_NUMBER, 
        host: process.env.HOST 
    })
    .catch( (error) => {
        console.log(error); 
        process.exit(1); 
    });
    return server;
}



