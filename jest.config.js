module.exports = {
    //"verbose": true,
    "testEnvironment": "node",
    "setupFiles": ["./testEnvSetup.js"],
    "setupFilesAfterEnv": ["./testSuiteSetup.js"],
    "globalSetup": "./testSetup.js",
    "globalTeardown": "./testTeardown.js"
};