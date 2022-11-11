require("dotenv").config({ path: ".env" });
const fs = require("fs");

module.exports = {
    production: {
        trustProxy: true,
        logger: true,
        https: {
            allowHTTP1: true,
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
            cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
        },
    },
    development: {
        trustProxy: false,
        logger: {
            transport: {
                target: "pino-pretty",
                options: {
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
            },
        },
        https: {
            allowHTTP1: true,
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
            cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
        },
    }
};