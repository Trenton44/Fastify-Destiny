export default {
    "verbose": true,
    "transform": {},
    "testEnvironment": "jest-environment-node",
    "setupFiles": ["./jest_env_setup.cjs"],
    "setupFilesAfterEnv": ["./jest_suite_setup.js"],
    "globalSetup": "./jest_global_setup.js",
    "globalTeardown": "./jest_global_teardown.js",
    "roots": ["./", "./bungie-api/", "./bungie-api/session/"]
};