import https from "https";
import JSONMap from "../utils/JsonMap.js";
import { MongoClient } from "mongodb";

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Connect to local database "ManifestDB"
console.log("Connecting to DB "+process.argv[4]);
const db = await MongoClient.connect(process.argv[4], {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then( conn => conn.db("ManifestDB"));
await db.command({ ping: 1 });

//Create collection using manifest lanugage name.
const collection = await db.collection(process.argv[3]);

// Function that fetches a file and returns a promise. resolves to the data parsed as a JSON object
const DownloadFile = (url) => new Promise((resolve, reject) => {
    console.log("Downloading "+url);
    let data = "";
    https.get(url, res => {
        console.log("recieved response, processing data...");
        res.setEncoding("utf8");
        res.on("data", d => data += d);
        res.on("end", () => resolve(JSON.parse(data)));
    })
    .on("error", (err) => reject(err));
});

//Prints a counter every 3 seconds, to track teh upload progress of the JSON data to the local DB.
const print = async (counter) => {
    while(counter.num !== -1){
        console.log(process.argv[3]+ ": "+counter.num);
        await sleep(3000);
    }
    return true;
};

console.log("Starting file download in subprocess.");
const manifest = await DownloadFile(process.argv[2]).catch(err => {
    console.error();
    process.exit(1);
});
console.log("Succesfully downloaded "+process.argv[2]);

/*
    generator object flatmaps each leaf node of the JSON object,
    returning the location of the leaf in one string, and it's value
*/
console.log("Uploading manifest to "+process.argv[3]+" collection.");
let flat = new JSONMap(manifest);
flat = flat.generate("", flat.obj);
let next = flat.next();
let counter = {num:0};
print(counter);
while(!next.done){
    await collection.insertOne({
        _id: next.value[0],
        value: next.value[1]
    });
    next = flat.next();
    counter.num += 1;
}
counter.num = -1;
process.exit(0); 