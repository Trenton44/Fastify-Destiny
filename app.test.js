process.env.MONGO_DB_URL = global.__MONGO_URI__;
const opts = require("./settings.js")(process.env.NODE_ENV);
const app = require("./app.js");

test.only('server should fail to load if no ORIGIN env variable exists', () => {
    let origin = process.env.ORIGIN;
    delete process.env.ORIGIN;
    expect(() => app(opts)).toThrow(Error);
    process.env.ORIGIN = origin;
});

