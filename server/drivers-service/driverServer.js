require("dotenv").config()
const express = require("express")
const app = express()
const MongoClient = require("mongodb").MongoClient

const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(express.json())
app.use(express.urlencoded({extended: true}))
PORT = process.env.PORT || 5556

const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });


app.get("/", (req, res) => {
    res.send("All is good at Driver server")
})



clientMongo.connect(function(err) {
    //if (err) throw err
    console.log("Successful connection to Database")

    const dbMongo = clientMongo.db(dbName)
    const collectionDrivers_profiles = dbMongo.collection(
        "drivers_profiles"
    )
    // Initialize the driver list variable
    let driverDataList

    collectionDrivers_profiles.find({}).toArray()
    .then((result) => {
        driverDataList = result
    }).catch((error) => {
        console.log(error)
    })

    app.get("/driver-data", (req, res) => {
        let response = res
        response.json(driverDataList)
    })
})

app.listen(PORT, () => {
    console.log("Driver server up and running")
})

