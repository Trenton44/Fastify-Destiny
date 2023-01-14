import { mkdir } from "node:fs/promises";
/*
    This server is NOT ephemeral, and data WILL persist after program exit.
*/
const __dirname = new URL("./", import.meta.url).pathname;
const DB_NAME = "ManifestDB";
const DB_PATH = __dirname+DB_NAME;

await mkdir(DB_PATH, { recursive: true });

const DB_INSTANCE_OPTIONS = {
    instance: {
        storageEngine: "wiredTiger",
        dbPath: DB_PATH,
        dbName: DB_NAME
    }
};
export { DB_NAME, DB_INSTANCE_OPTIONS };
