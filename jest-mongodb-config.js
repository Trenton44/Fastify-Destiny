
module.exports = {
  //NOTE: connecting to DB requires use of global.__MONGO_URI__, NOT process.env.MONGO_DB_URL
  useSharedDBForAllJestWorkers: false,
  mongodbMemoryServerOptions: {
    binary: {
      version: '4.0.3',
      skipMD5: true,
    },
    autoStart: false,
    instance: {},
  },
};