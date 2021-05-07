console.log = function () {};
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

const PORT = process.env.PASSENGER_ROOT
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });

// For testing purpose:
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

    //getAsync("passengers-cache").then( (reply) => {
    client.get("passengers-cash", (err, reply) => {    
        console.log("looking for data...")
        if (err) {
            // Connect to db and fetch:
            IndividualsCollection
            .find({})
            .limit(10)
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
                        client.setex("passengers-cash", 200000,JSON.stringify(result), redis.print)
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
        } else if(reply) {
            if(reply !== null) {
                // Resolve reply
                resolve(JSON.parse(reply))
                //!! Update cash but do not resolve anything:
                console.log("updating passengers cache...")
                new Promise((cashUpdateRes) => {
                    // Connect to db, do the operation and save result in redis:
                    IndividualsCollection
                    .find({})
                    .limit(50)
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
                                //resolve(result)
                                // save in cache
                                client.setex("passengers-cash", 200000, JSON.stringify(result), redis.print)
                                console.log("UPDATING cash in progress....")
                            },
                            (error) => {
                                console.log(error)
                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                            }
                        )
                    }).catch((error) => {
                        console.log(error)
                    })  
                    

                }).then((result) => {
                    console.log("Updating passengers cache complete...")
                }, (error) => {
                    console.log(error)
                    resolve({error: "something went wrong"})
                })

            } else {

                // Connect to db and fetch data
                IndividualsCollection
                .find({})
                .sort({"date_registered.date": -1})
                .limit(50)
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
                            client.setex("passengers-cash", 200000, JSON.stringify(result))
                            resolve(result)
                            // save in cache
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
        } else {
            // Connect to db and fetch
            console.log("No cache...getting passengers data from db")
            IndividualsCollection
                .find({})
                .limit(10)
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
                            client.setex("passengers-cash", 200000, JSON.stringify(result))
                            resolve(result)
                            // save in cache
                          
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

    })
    
}



/**
 * 
 * *Returns the cancellled rides from passengers
 * @param {collection} collectionCancelledRides 
 * @param {collection} collectionPassengers 
 * @param {collection} collectionDrivers 
 * @param {*} resolve 
 */

 function getCancelledRidesPassenger(collectionCancelledRides, collectionPassengers, collectionDrivers, resolve){
    // Attempt to get data from cache first
    client.get("cancelledRides-cache", (err, reply) => {
      console.log("looking for data in redis...")
  
      if (err) {
        console.log(err)
        // Function to get data directly from Mongo
        collectionCancelledRides
        .find({ride_mode: "RIDE"})
        .sort({date_requested: -1})
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested
              const carTypeSelected = cancelled.carTypeSelected
              const passengers_number = cancelled.passengers_number
              const connect_type = cancelled.connect_type
              const origin = cancelled.pickup_location_infos.suburb
              const destination = cancelled.destinationData.map((destination) => {
                  return destination.suburb 
              })
              const fare = cancelled.fare
  
              queryPassenger = {user_fingerprint: cancelled.client_id}
              //Get passenger Data
              collectionPassengers
              .findOne(queryPassenger)
              .then((passenger) => {
                const passenger_name = passenger? passenger.name: "not found"
                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                // Get the driver info in case ride was accepted before cancellation
                if (cancelled.taxi_id) {
                  collectionDrivers
                  .findOne({driver_fingerprint: cancelled.taxi_id})
                  .then((driver) => {
                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                    const driver_name = driver? driver.name : "not found"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                  })
                  .catch((error) => {
                    console.log(error)
                    resolve({error: "something went wrong @Driver collection"})
                  })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              client.setex("cancelledRides-cache", 600000, JSON.stringify(result), redis.print)
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
  
  
      } else if(reply) {
        if(reply !== null) {
          // return cached data
          resolve(JSON.parse(reply))
  
          //! Update cache in background
                // Function to get data directly from Mongo
          new Promise ((cashupdateInBackground) => {
  
          
            collectionCancelledRides
            .find({ride_mode: "RIDE"})
            .sort({date_requested: -1})
            .limit(100)
            .toArray()
            .then((result) => {
              // Map through all cancelled ride and return needed info/field
              let allCancelled = result.map((cancelled) => {
                return new Promise((response) => {
                  // Get the following for each ride
                  const date_requested = cancelled.date_requested
                  const carTypeSelected = cancelled.carTypeSelected
                  const passengers_number = cancelled.passengers_number
                  const connect_type = cancelled.connect_type
                  const origin = cancelled.pickup_location_infos.suburb
                  const destination = cancelled.destinationData.map((destination) => {
                      return destination.suburb 
                  })
                  const fare = cancelled.fare
  
                  queryPassenger = {user_fingerprint: cancelled.client_id}
                  //Get passenger Data
                  collectionPassengers
                  .findOne(queryPassenger)
                  .then((passenger) => {
                    const passenger_name = passenger? passenger.name: "not found"
                    const passenger_phone_number = passenger? passenger.phone_number: "not found"
                    // Get the driver info in case ride was accepted before cancellation
                    if (cancelled.taxi_id) {
                      collectionDrivers
                      .findOne({driver_fingerprint: cancelled.taxi_id})
                      .then((driver) => {
                        const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                        const driver_name = driver? driver.name : "not found"
  
                        //Return the final object
                        response({
                          date_requested,
                          passengers_number,
                          connect_type,
                          origin,
                          destination,
                          fare,
                          passenger_name,
                          passenger_phone_number,
                          taxi_number,
                          driver_name,
                          carTypeSelected
                        })
                      })
                      .catch((error) => {
                        console.log(error)
                        resolve({error: "something went wrong @Driver collection"})
                      })
                  } else {
                      const taxi_number = "N/A"
                      const driver_name = "N/A"
  
                      //Return the final object
                      response({
                        date_requested,
                        passengers_number,
                        connect_type,
                        origin,
                        destination,
                        fare,
                        passenger_name,
                        passenger_phone_number,
                        taxi_number,
                        driver_name,
                        carTypeSelected
                      })
                  }
                })
                .catch((error) => {
                  console.log(error)
                  resolve({error: "something went wrong@passengerCollection"})
                })
              })
            })
            // Get all resulting cancelled rides
            Promise.all(allCancelled).then(
              (result) => {
                console.log("No cash was found for cancelled rides")
                client.setex("cancelledRides-cache", 600000, JSON.stringify(result), redis.print)
                //! No resolve
              },
              (error) => {
                console.log(error)
                resolve({error: "Did not manage to get all promises"})
              }
            )
          })
          
        })
  
        } else {
              // Function to get data directly from Mongo
          collectionCancelledRides
          .find({ride_mode: "RIDE"})
          .sort({date_requested: -1})
          .limit(100)
          .toArray()
          .then((result) => {
            // Map through all cancelled ride and return needed info/field
            let allCancelled = result.map((cancelled) => {
              return new Promise((response) => {
                // Get the following for each ride
                const date_requested = cancelled.date_requested
                const carTypeSelected = cancelled.carTypeSelected
                const passengers_number = cancelled.passengers_number
                const connect_type = cancelled.connect_type
                const origin = cancelled.pickup_location_infos.suburb
                const destination = cancelled.destinationData.map((destination) => {
                    return destination.suburb 
                })
                const fare = cancelled.fare
  
                queryPassenger = {user_fingerprint: cancelled.client_id}
                //Get passenger Data
                collectionPassengers
                .findOne(queryPassenger)
                .then((passenger) => {
                  const passenger_name = passenger? passenger.name: "not found"
                  const passenger_phone_number = passenger? passenger.phone_number: "not found"
                  // Get the driver info in case ride was accepted before cancellation
                  if (cancelled.taxi_id) {
                    collectionDrivers
                    .findOne({driver_fingerprint: cancelled.taxi_id})
                    .then((driver) => {
                      const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                      const driver_name = driver? driver.name : "not found"
  
                      //Return the final object
                      response({
                        date_requested,
                        passengers_number,
                        connect_type,
                        origin,
                        destination,
                        fare,
                        passenger_name,
                        passenger_phone_number,
                        taxi_number,
                        driver_name,
                        carTypeSelected
                      })
                    })
                    .catch((error) => {
                      console.log(error)
                      resolve({error: "something went wrong @Driver collection"})
                    })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
        }
      } else {
        // Function to get data directly from Mongo
        collectionCancelledRides
        .find({ride_mode: "RIDE"})
        .sort({date_requested: -1})
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested
              const carTypeSelected = cancelled.carTypeSelected
              const passengers_number = cancelled.passengers_number
              const connect_type = cancelled.connect_type
              const origin = cancelled.pickup_location_infos.suburb
              const destination = cancelled.destinationData.map((destination) => {
                  return destination.suburb 
              })
              const fare = cancelled.fare
  
              queryPassenger = {user_fingerprint: cancelled.client_id}
              //Get passenger Data
              collectionPassengers
              .findOne(queryPassenger)
              .then((passenger) => {
                const passenger_name = passenger? passenger.name: "not found"
                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                // Get the driver info in case ride was accepted before cancellation
                if (cancelled.taxi_id) {
                  collectionDrivers
                  .findOne({driver_fingerprint: cancelled.taxi_id})
                  .then((driver) => {
                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                    const driver_name = driver? driver.name : "not found"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                  })
                  .catch((error) => {
                    console.log(error)
                    resolve({error: "something went wrong @Driver collection"})
                  })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              client.setex("cancelledRides-cache", 600000, JSON.stringify(result), redis.print)
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
      }
    })
}

/**
 * * CANCELLED DELIVERIES BY PASSENGER
 */

function getCancelledDeliveries(collectionCancelledRides, collectionPassengers, collectionDrivers, resolve){
    // Attempt to get data from cache first
    client.get("cancelledDeliveries-cache", (err, reply) => {
      console.log("looking for data in redis...")
  
      if (err) {
        console.log(err)
        // Function to get data directly from Mongo
        collectionCancelledRides
        .find({ride_mode: "DELIVERY"})
        .sort({date_requested: -1})
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested
              const carTypeSelected = cancelled.carTypeSelected
              const passengers_number = cancelled.passengers_number
              const connect_type = cancelled.connect_type
              const origin = cancelled.pickup_location_infos.suburb
              const destination = cancelled.destinationData.map((destination) => {
                  return destination.suburb 
              })
              const fare = cancelled.fare
  
              queryPassenger = {user_fingerprint: cancelled.client_id}
              //Get passenger Data
              collectionPassengers
              .findOne(queryPassenger)
              .then((passenger) => {
                const passenger_name = passenger? passenger.name: "not found"
                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                // Get the driver info in case ride was accepted before cancellation
                if (cancelled.taxi_id) {
                  collectionDrivers
                  .findOne({driver_fingerprint: cancelled.taxi_id})
                  .then((driver) => {
                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                    const driver_name = driver? driver.name : "not found"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                  })
                  .catch((error) => {
                    console.log(error)
                    resolve({error: "something went wrong @Driver collection"})
                  })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              client.setex("cancelledDeliveries-cache", 600000, JSON.stringify(result), redis.print)
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
  
  
      } else if(reply) {
        if(reply !== null) {
          // return cached data
          resolve(JSON.parse(reply))
  
          //! Update cache in background
                // Function to get data directly from Mongo
          new Promise ((cashupdateInBackground) => {
  
          
            collectionCancelledRides
            .find({ride_mode: "DELIVERY"})
            .sort({date_requested: -1})
            .limit(100)
            .toArray()
            .then((result) => {
              // Map through all cancelled ride and return needed info/field
              let allCancelled = result.map((cancelled) => {
                return new Promise((response) => {
                  // Get the following for each ride
                  const date_requested = cancelled.date_requested
                  const carTypeSelected = cancelled.carTypeSelected
                  const passengers_number = cancelled.passengers_number
                  const connect_type = cancelled.connect_type
                  const origin = cancelled.pickup_location_infos.suburb
                  const destination = cancelled.destinationData.map((destination) => {
                      return destination.suburb 
                  })
                  const fare = cancelled.fare
  
                  queryPassenger = {user_fingerprint: cancelled.client_id}
                  //Get passenger Data
                  collectionPassengers
                  .findOne(queryPassenger)
                  .then((passenger) => {
                    const passenger_name = passenger? passenger.name: "not found"
                    const passenger_phone_number = passenger? passenger.phone_number: "not found"
                    // Get the driver info in case ride was accepted before cancellation
                    if (cancelled.taxi_id) {
                      collectionDrivers
                      .findOne({driver_fingerprint: cancelled.taxi_id})
                      .then((driver) => {
                        const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                        const driver_name = driver? driver.name : "not found"
  
                        //Return the final object
                        response({
                          date_requested,
                          passengers_number,
                          connect_type,
                          origin,
                          destination,
                          fare,
                          passenger_name,
                          passenger_phone_number,
                          taxi_number,
                          driver_name,
                          carTypeSelected
                        })
                      })
                      .catch((error) => {
                        console.log(error)
                        resolve({error: "something went wrong @Driver collection"})
                      })
                  } else {
                      const taxi_number = "N/A"
                      const driver_name = "N/A"
  
                      //Return the final object
                      response({
                        date_requested,
                        passengers_number,
                        connect_type,
                        origin,
                        destination,
                        fare,
                        passenger_name,
                        passenger_phone_number,
                        taxi_number,
                        driver_name,
                        carTypeSelected
                      })
                  }
                })
                .catch((error) => {
                  console.log(error)
                  resolve({error: "something went wrong@passengerCollection"})
                })
              })
            })
            // Get all resulting cancelled rides
            Promise.all(allCancelled).then(
              (result) => {
                console.log("No cash was found for cancelled rides")
                client.setex("cancelledDeliveries-cache", 600000, JSON.stringify(result), redis.print)
                //! No resolve
              },
              (error) => {
                console.log(error)
                resolve({error: "Did not manage to get all promises"})
              }
            )
          })
          
        })
  
        } else {
              // Function to get data directly from Mongo
          collectionCancelledRides
          .find({ride_mode: "DELIVERY"})
          .sort({date_requested: -1})
          .limit(100)
          .toArray()
          .then((result) => {
            // Map through all cancelled ride and return needed info/field
            let allCancelled = result.map((cancelled) => {
              return new Promise((response) => {
                // Get the following for each ride
                const date_requested = cancelled.date_requested
                const carTypeSelected = cancelled.carTypeSelected
                const passengers_number = cancelled.passengers_number
                const connect_type = cancelled.connect_type
                const origin = cancelled.pickup_location_infos.suburb
                const destination = cancelled.destinationData.map((destination) => {
                    return destination.suburb 
                })
                const fare = cancelled.fare
  
                queryPassenger = {user_fingerprint: cancelled.client_id}
                //Get passenger Data
                collectionPassengers
                .findOne(queryPassenger)
                .then((passenger) => {
                  const passenger_name = passenger? passenger.name: "not found"
                  const passenger_phone_number = passenger? passenger.phone_number: "not found"
                  // Get the driver info in case ride was accepted before cancellation
                  if (cancelled.taxi_id) {
                    collectionDrivers
                    .findOne({driver_fingerprint: cancelled.taxi_id})
                    .then((driver) => {
                      const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                      const driver_name = driver? driver.name : "not found"
  
                      //Return the final object
                      response({
                        date_requested,
                        passengers_number,
                        connect_type,
                        origin,
                        destination,
                        fare,
                        passenger_name,
                        passenger_phone_number,
                        taxi_number,
                        driver_name,
                        carTypeSelected
                      })
                    })
                    .catch((error) => {
                      console.log(error)
                      resolve({error: "something went wrong @Driver collection"})
                    })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
        }
      } else {
        // Function to get data directly from Mongo
        collectionCancelledRides
        .find({ride_mode: "DELIVERY"})
        .sort({date_requested: -1})
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested
              const carTypeSelected = cancelled.carTypeSelected
              const passengers_number = cancelled.passengers_number
              const connect_type = cancelled.connect_type
              const origin = cancelled.pickup_location_infos.suburb
              const destination = cancelled.destinationData.map((destination) => {
                  return destination.suburb 
              })
              const fare = cancelled.fare
  
              queryPassenger = {user_fingerprint: cancelled.client_id}
              //Get passenger Data
              collectionPassengers
              .findOne(queryPassenger)
              .then((passenger) => {
                const passenger_name = passenger? passenger.name: "not found"
                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                // Get the driver info in case ride was accepted before cancellation
                if (cancelled.taxi_id) {
                  collectionDrivers
                  .findOne({driver_fingerprint: cancelled.taxi_id})
                  .then((driver) => {
                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                    const driver_name = driver? driver.name : "not found"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                  })
                  .catch((error) => {
                    console.log(error)
                    resolve({error: "something went wrong @Driver collection"})
                  })
                } else {
                    const taxi_number = "N/A"
                    const driver_name = "N/A"
  
                    //Return the final object
                    response({
                      date_requested,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      carTypeSelected
                    })
                }
              })
              .catch((error) => {
                console.log(error)
                resolve({error: "something went wrong@passengerCollection"})
              })
            })
          })
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              console.log("No cash was found for cancelled rides")
              client.setex("cancelledDeliveries-cache", 600000, JSON.stringify(result), redis.print)
              resolve(result)
            },
            (error) => {
              console.log(error)
              resolve({error: "Did not manage to get all promises"})
            }
          )
        })
        .catch((error) => {
          console.log(error)
        })
      }
    })
}



clientMongo.connect(function(err) {
    if (err) {
        console.log(`Error occured: ${err}`)
    } else {

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
                console.log(`Number of passengers returned: ${result.length}`)
                response.json(passengerList)
            }).catch((error) => {
                console.log(error)
                response.json({"error": "something went wrong. Maybe no connection or wrong parameters"})
            })
        })

        app.get("/cancelled-ride-passenger", (req,res) => {
            
            new Promise((res) => {
                getCancelledRidesPassenger(collectionRidesDeliveryDataCancelled,
                    collectionPassengers_profiles, collectionDrivers_profiles, res)
            })
            .then((data) => {
                if(data.error){
                    res.send({error: "could not get cancelled rides"})
                } else {
                    console.log("No error, returning cancelled rides by passenger")
                    res.send(data)
                }
            })
            .catch((error) => {
                console.log(error)
                res.send({error: true, flag: "Error occured @cancelled-ride-passenger API level"})
            })
        })

        app.get("/cancelled-deliveries-passenger", (req,res) => {
            
          new Promise((res) => {
              getCancelledDeliveries(collectionRidesDeliveryDataCancelled,
                  collectionPassengers_profiles, collectionDrivers_profiles, res)
          })
          .then((data) => {
              if(data.error){
                  res.send({error: "could not get cancelled deliveries"})
              } else {
                  console.log("No error, returning cancelled deliveries by passenger")
                  res.send(data)
              }
          })
          .catch((error) => {
              console.log(error)
              res.send({error: true, flag: "Error occured @cancelled-deliveries-passenger API level"})
          })
      })
    }
    
})

server.listen(PORT, () => {
    console.log(`Passenger server up and running @ port ${PORT}`)
})

