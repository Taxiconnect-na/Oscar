const path = require('path')
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});
const express = require("express")
const app = express()
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient

const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(express.json({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(express.urlencoded({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(cors())

const PORT = process.env.PASSENGER_ROOT

const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });


app.get("/", (req, res) => {
    res.send("All is good at Passenger server")
})

/**
 * @function getPassengersInfo : Collects the passengers details from db, including total trips per user
 * @param {Database collection} IndividualsCollection 
 * @param {Database collection} FilteringCollection 
 * @param {return} resolve 
 */

function getPassengersInfo(IndividualsCollection,FilteringCollection, resolve) {

    IndividualsCollection
    .find({})
    .toArray()
    .then((individualsList) => {
        let passengers = individualsList.map((individual) => {
            return new Promise((outcome) => {
                // Get the following:
                const name = individual.name
                const surname = individual.surname
                const gender = individual.gender
                const phone_number = individual.phone_number
                const email = individual.email
                const date_registered = individual.date_registered
                // And so on...

                //Then:
                query = {
                    client_id: individual.user_fingerprint
                }
                
                FilteringCollection
                .find(query)
                .toArray()
                .then((result) => {
                    // Initialize the individual's data Object
                    const Individual_info = {}
                    
                    // Append data to the individual's data Object
                    Individual_info.name = name
                    Individual_info.surname = surname
                    Individual_info.gender = gender
                    Individual_info.phone_number = phone_number
                    Individual_info.email = email
                    Individual_info.date_registered = date_registered
                    Individual_info.totaltrip = result.length

                    // append the resulting object to the passengers array
                    outcome(Individual_info)

                }).catch((error) => {
                    console.log(error)
                })
            })
        })
        Promise.all(passengers).then(
            (result) => {
                resolve(result)
            },
            (error) => {
                console.log(error)
                resolve({ response: "error", flag: "Invalid_params_maybe" })
            }
        )
    }).catch((error) => {
        console.log(error)
    })  
}





clientMongo.connect(function(err) {
    //if (err) throw err
    console.log("Successful connection to Database")

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
    // Initialize the passenger list variable
    let passengerDataList

    app.get("/passenger-data", (req, res) => {
        let response = res
      
        new Promise((res) => {
            getPassengersInfo(collectionPassengers_profiles, collectionRidesDeliveryData, res)
        }).then((result) => {
            let passengerList = result
            console.log("Passenger's Data API called")
            console.log(result)
            response.json(passengerList)
        }).catch((error) => {
            console.log(error)
            response.json({"error": "something went wrong. Maybe no connection or wrong parameters"})
        })
    })
    
})

app.listen(PORT, () => {
    console.log(`Passenger server up and running @ port ${PORT}`)
})

