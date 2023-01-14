/*
    Note: This server is ephemeral, and will destroy itself on server shutdown
    These options are stored seperately here, as they are used in both the jest testing framework & the dev environment
*/
export default DB_INSTANCE_OPTIONS = {
    instance: {
        ip: process.env.HOST,
        dbName: process.env.MONGO_DB_NAME,
    }
};