module.exports = {
    mongodbMemoryServerOptions: {
      binary: {
        version: '4.0.3',
        skipMD5: true,
      },
      instance: {
        dbName: 'sessions',
      },
      autoStart: false,
    },
    mongoURLEnvName: 'MONGO_DB_URL',
  };