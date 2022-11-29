module.exports = {
    //"verbose": true,
    "testEnvironment": "node",
    "setupFiles": ["./jest_env_setup.js"],
    "setupFilesAfterEnv": ["./jest_suite_setup.js"],
    "globalSetup": "./jest_global_setup.js",
    "globalTeardown": "./jest_global_teardown.js"
};