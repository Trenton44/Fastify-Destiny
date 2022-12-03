
//Built-in libraries
import "dotenv/config";
import server from "./app.js";

console.log("Starting server.");
server.listen({ 
    port: process.env.PORT_NUMBER, 
    host: process.env.HOST 
}).catch( (error) => {
    console.log(error); 
    process.exit(1); 
});


