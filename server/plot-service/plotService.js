//console.log = function () {};
const path = require('path')
// For self contained app
//require("dotenv").config({ path: path.resolve(__dirname, './.env')});
// For overall server
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});

const express = require("express")
const app = express()
const helmet = require("helmet")
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient

const redis = require("redis")
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const http = require("http")
/*const https = require("https")
const fs = require("fs")
//Options to be passed to https server
const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "../Encryptions/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../Encryptions/cert.pem"))
}
const server = https.createServer(sslOptions, app) */
const server = http.createServer(app)
//const { promisify } = require("util");
//const getAsync = promisify(client.get).bind(client)


const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(express.json({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(express.urlencoded({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(cors())
app.use(helmet())

const PORT = process.env.PLOT_ROOT
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
});

// For testing purpose:
app.get("/", (req, res) => {
    res.send("All is good at Passenger server")
})

  

clientMongo.connect(function(err) {
    if (err) {
        console.log(`Error occured: ${err}`)
    } else {

        console.log("Successful connection to Database @Plot-server")

        const dbMongo = clientMongo.db(dbName)
        const collectionPassengers_profiles = dbMongo.collection(
            "passengers_profiles"
        )
        const collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
        const collectionRidesDeliveryData = dbMongo.collection(
            "rides_deliveries_requests"
        )
        const collectionRidesDeliveryDataCancelled = dbMongo.collection(
            "cancelled_rides_deliveries_requests"
        )
        

        app.get("/plot-data", (req, res) => {
            
        })

        
    }
    
})

server.listen(PORT, () => {
    console.log(`Plot server up and running @ port ${PORT}`)
})

