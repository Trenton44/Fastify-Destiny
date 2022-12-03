export default async function(globalConfig, projectConfig){
    await globalThis.__MONGOCONNECT__.close();
    console.log("Successfully closed connection to test server.");
    await globalThis.__MONGOSERVER__.stop();
    console.log("Successfully closed mongo server.");
    return true;
}