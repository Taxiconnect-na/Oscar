require("dotenv").config()
const express = require("express")
const app = express()
const MongoClient = require("mongodb").MongoClient

const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(express.json())
app.use(express.urlencoded({extended: true}))
PORT = process.env.PORT || 5557

const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });


app.get("/", (req, res) => {
    res.send("All is good at Passenger server")
})



clientMongo.connect(function(err) {
    //if (err) throw err
    console.log("Successful connection to Database")

    const dbMongo = clientMongo.db(dbName)
    const collectionPassengers_profiles = dbMongo.collection(
        "passengers_profiles"
      )
    // Initialize the passenger list variable
    let passengerDataList

    collectionPassengers_profiles.find({}).toArray()
    .then((result) => {
        passengerDataList = result
    }).catch((error) => {
        console.log(error)
    })

    app.get("/passenger-data", (req, res) => {
        let response = res
        response.json(passengerDataList)
    })
})

app.listen(PORT, () => {
    console.log("Passenger server up and running")
})

