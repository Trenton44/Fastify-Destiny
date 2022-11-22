
//Built-in libraries
require("dotenv").config({ path: ".env" });

const opts = require("./settings.js")(process.env.NODE_ENV);

if(process.env.NODE_ENV == "development"){
    require("./localdb.js").then( (db) => {
        process.env.MONGO_DB_URL = db.getUri();
        let host = startServer();
        host.addHook("onClose", () => db.stop());
    })
    .catch( error => error);
}
else{ startServer(); }
    

    
function startServer(){
    server = require("./app.js")(opts);
    console.log("Starting server.");
    server.listen({ 
        port: process.env.PORT_NUMBER, 
        host: process.env.HOST 
    })
    .then( (address) => console.log("server listening on "+address))
    .catch( (error) => {
        console.log(error); 
        process.exit(1); 
    });
    return server;
}
// Start the server, listening on port PORT_NUMBER


