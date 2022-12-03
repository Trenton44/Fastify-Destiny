import Fastify from "fastify";
import cors from '@fastify/cors'
import Bungie from "./bungie-api/fastify_plugin.js"; // need to do this one
import settings from "./settings.js";

if(!process.env.ORIGIN)
    throw Error("Missing ORIGIN env variable.");

const app = Fastify(settings(process.env.NODE_ENV));
app.register(cors, {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
    strictPreflight: true,
});
app.register(Bungie);

export default app;