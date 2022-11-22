require("dotenv").config({ path: ".env" });
const fs = require("fs");

let envs = {
    development: {
        logger: {
            transport: {
                target: "pino-pretty",
                options: {
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
            },
        },
    },
    testing: { trustProxy: true, },
    production: { trustProxy: true, },
}

module.exports = (env) => {
    return {
        https: {
            allowHTTP1: true,
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
            cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
        },
        trustProxy: envs[env].trustProxy ? envs[env].trustProxy : false,
        logger: envs[env].logger ? envs[env].logger : true,
    };
}
