jest.mock("./bungie-api/session/store.js");
jest.mock("./bungie-api/session/settings.js");

const buildServer = () => {
    let app = require("fastify")();
    app.register(require("./bungie-api/fastify_plugin.js"));
    return app;
};
beforeAll(async () => {
    console.log("Creating MongoDB Collection.");
    global.MongoCollection = await globalThis.__MONGODB__.collection(process.env.MONGO_DB_COLLECTION); // Promise to collection, for easy access in test suites
    console.log("Initializing application server.");
    global.App = buildServer();
    await global.App.ready();
});

afterAll(() => {
    console.log("Closing application server.");
    global.App.close();
})