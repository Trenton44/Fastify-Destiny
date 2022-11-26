require("dotenv").config({ path: ".env-test" });
const { MongoClient } = require("mongodb");

function mockUserData() {
    return {
        language: "en",
        membershipId: 213098549320,
        active: 1209835432,
        profiles: {
            "1209835432": {
                membershipId: "1209835432"
            }
        }
    };
}
function mockAuthData(){
    return {
        access_token: 12934075490328762,
        token_type: "Bearer",
        expires_in: 10000,
        refresh_token: 1029573930,
        refresh_expires_in: 10000,
        membership_id: 1902890850
    };
}
function mockUserSession(){
    let temp = require("./bungie-api/session.js").buildSession();
    temp.authData = mockAuthData();
    temp._user = mockUserData();
    return temp;
}

async function connectDatabase(connectionString){
    let connection = await MongoClient.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    return connection;
}

function buildServer(){
    const opts = require("./settings.js")(process.env.NODE_ENV);
    return require("./app.js")(opts);
}

module.exports = { connectDatabase, mockUserSession, buildServer };