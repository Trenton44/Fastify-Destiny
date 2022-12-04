import {jest} from "@jest/globals";
import MongoStore from "connect-mongo";
import UserSession from "./bungie-api/session/UserSession.js";

import { createRequire } from 'node:module';
globalThis.__REQUIREMODULE__ = createRequire(import.meta.url);

jest.unstable_mockModule("axios", () => {
    const mockAxios = jest.createMockFromModule("axios");
    mockAxios.create = jest.fn(() => mockAxios);
    return mockAxios;
});
jest.unstable_mockModule("./bungie-api/api_request.js", () => {
    return { default: jest.fn() };
});
jest.unstable_mockModule("./bungie-api/session/store.js", () => {
    return {
        default: new MongoStore({
            client: globalThis.__MONGOCONNECT__,
            dbName: process.env.MONGO_DB_NAME,
            collectionName: process.env.MONGO_DB_COLLECTION,
            stringify: false,
            serialize: (session) => { 
                session.data = session.data.toJSON();
                return session;
            },
            unserialize: (session) => { 
                session.data = new UserSession(session.data); 
                return session;
            },
            
        })
    };
});
jest.unstable_mockModule("./bungie-api/session/settings.js", async () => {
    const { default: sessionStore } = await import("./bungie-api/session/store.js");
    return {
        default: {
            secret: process.env.SESSION_STORE_SECRET,
            cookieName: process.env.COOKIE_NAME,
            saveUninitialized: true,
            idGenerator: (request) => global.sessionID,
            cookie: {
                path: "/",
                maxAge: 3600000,
                secure: false,
                httpOnly: false,
                sameSite: "Lax"
            },
            store: sessionStore
        }
    };
});

beforeAll(async () => {
    console.log("Creating MongoDB Collection.");
    global.MongoCollection = await globalThis.__MONGODB__.collection(process.env.MONGO_DB_COLLECTION); // Promise to collection, for easy access in test suites
    console.log("Initializing application server.");
    const { default: app } = await import("./app.js");
    global.App = app;
});
afterAll(async () => await global.App.close());