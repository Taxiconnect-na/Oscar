require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient;

app.use(cors())

const PORT = process.env.PORT || 5555;
const uri = process.env.DB_URI;
const dbName = process.env.DB_NAME;
const clientMongo = new MongoClient(uri, {
  useUnifiedTopology: true,
});

/**
 * 
 * @param {collection} collectionName 
 * @param {object} query 
 * @function GetTotal 
 */

function GetTotal(collectionName, query, resolve) {
  //var completedCheck = { isArrivedToDestination: true}
  collectionName
    .find(query)
    .toArray()
    .then((result) => {
      let fare_array = [];
      const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);
      result.map((ride) => {
        fare_array.push(Number(ride["fare"]));
      });
      total_fare = Sum(fare_array);
      //console.log(`Total fare: ${total_fare}`)
      //total rides
      total_rides = result.length;
      totalObject = { total_fare, total_rides };
      resolve(totalObject);
      //console.log(`total rides: ${total_rides}`)
    })
    .catch((error) => {
      console.log(error);
    });
}

function GetDailyRegistered(collectionName, resolve) {
  let startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  collectionName
    .find({ date_registered: { $gte: startOfToday } })
    .toArray()
    .then((result) => {
      let totalRegisteredToday = new Object();
      totalRegisteredToday.totalRegisteredToday = result.length;
      resolve(totalRegisteredToday);
    })
    .catch((err) => console.log(err));
}

function GetCashWallet(collectionName, resolve) {
  collectionName
    .find({ isArrivedToDestination: true })
    .toArray()
    .then((result) => {
      let fare_array = [];
      let fare_array_cash = [];
      let fare_array_wallet = [];
      const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);
      result.map((ride) => {
        fare_array.push(Number(ride["fare"]));

        // Get rides with CASH as payment method
        let payment_method = ride["payment_method"].toUpperCase().trim();
        if (/CASH/i.test(payment_method)) {
          // if (payment_method ==="CASH") /CASH/ makes sure of spacing
          fare_array_cash.push(Number(ride["fare"]));
        } else {
          fare_array_wallet.push(Number(ride["fare"]));
        }
      });
      let total_fare = Sum(fare_array);
      let totalCash = Sum(fare_array_cash);
      let totalWallet = Sum(fare_array_wallet);
      let CashWalletObject = { totalCash, totalWallet };

      resolve(CashWalletObject);
    })
    .catch((err) => console.log(err));
}

/**
 * @func activelyGet_allThe_stats
 * ? This function will get all the statistics using your previous functions created above
 * @param collectionRidesDeliveryData: the collection of all the rides/deliveries requests
 * @param collectionRidesDeliveryDataCancelled: the collection of all the cancelled requests.
 * @param collectionDrivers_profiles: the collection of all the drivers profiles.
 * @param collectionPassengers_profiles: the collection of all the passengers profiles.
 * @param resolve: the main promise resolver.
 * ! SHould be able to hanle errors as well
 */
function activelyGet_allThe_stats(
  collectionRidesDeliveryData,
  collectionRidesDeliveryDataCancelled,
  collectionDrivers_profiles,
  collectionPassengers_profiles,
  resolve
) {
  let finalObject = new Object();
  new Promise((res) => {
    GetTotal(
      collectionRidesDeliveryData,
      { isArrivedToDestination: true },
      res
    );
  })
    .then((result) => {
      console.log(result);
      new Promise((res) => {
        GetTotal(collectionRidesDeliveryDataCancelled, {}, res);
      })
        .then((result2) => {
          console.log(result2);
          Fullcollect = { result, result2 };
          console.log(`Final: ${Fullcollect}`);
          //let finalObject = new Object()

          new Promise((res) => {
            GetTotal(
              collectionRidesDeliveryData,
              {
                date_requested: {
                  $regex: new Date().toISOString().replace(/\T.*/, " "),
                  $options: "i",
                },
                isArrivedToDestination: true,
              },
              res
            );
          })
            .then((result3) => {
              console.log(result3);

              console.log(finalObject);
              new Promise((res) => {
                GetTotal(
                  collectionRidesDeliveryDataCancelled,
                  {
                    date_requested: {
                      $regex: new Date().toISOString().replace(/\T.*/, " "),
                      $options: "i",
                    },
                  },
                  res
                );
              })
                .then((result4) => {
                  console.log(result4);

                  Promise.all([
                    new Promise((res) => {
                      GetDailyRegistered(collectionDrivers_profiles, res);
                    }),
                    new Promise((res) => {
                      GetDailyRegistered(collectionPassengers_profiles, res);
                    }),
                    new Promise((res) => {
                      GetCashWallet(collectionRidesDeliveryData, res);
                    }),
                  ])
                    .then((data) => {
                      let [dataDriver, dataPassenger, dataCashWallet] = data;

                      finalObject.totalFareSuccessful = result.total_fare;
                      finalObject.totalTripSuccessful = result.total_rides;
                      finalObject.totalFareCancelled = result2.total_fare;
                      finalObject.totalTripCancelled = result2.total_rides;
                      finalObject.totalFareSuccessfulToday = result3.total_fare;
                      finalObject.totalTripSuccessfulToday =
                        result3.total_rides;
                      finalObject.totalFareCancelledToday = result4.total_fare;
                      finalObject.totalTripCancelledToday = result4.total_rides;
                      finalObject.totalNewDriverToday =
                        dataDriver.totalRegisteredToday;
                      finalObject.totalNewPassengerToday =
                        dataPassenger.totalRegisteredToday;
                      finalObject.totalCash = dataCashWallet.totalCash;
                      finalObject.totalWallet = dataCashWallet.totalWallet;

                      //Done
                      console.log(finalObject);
                      //? resolve the main object with the successfull request
                      resolve(finalObject);
                    })
                    .catch((error) => {
                      console.log(error);
                      //! Return an error response
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  console.log(error);
                  //! Return an error response
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            })
            .catch((error) => {
              console.log(error);
              //! Return an error response
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            });
        })
        .catch((error) => {
          console.log(error);
          //! Return an error response
          resolve({ response: "error", flag: "Invalid_params_maybe" });
        });
    })
    .catch((error) => {
      console.log(error);
      //! Return an error response
      resolve({ response: "error", flag: "Invalid_params_maybe" });
    });
}


/**
 * @function getRideOverview
 * @param collectionRidesDeliveryData : collection of all rides and delivery requests
 * @param collectionPassengers_profiles : collection of all passenger profiles
 */

function getRideOverview(collectionRidesDeliveryData, 
  collectionPassengers_profiles,
  resolve ) {
    collectionRidesDeliveryData
      .find({ride_mode:"RIDE"})
      .toArray()
      .then((result) => {
          // Initialize the list of all trips
          //console.log(result)
          let alltrips =result.map((trip) => {
              return new Promise((res0) => {
                 
              // Get the following for each trip
                const passengers_number = trip.passengers_number
                const request_type = trip.request_type
                const date_time = trip.date_requested
                const wished_pickup_time = trip.wished_pickup_time
                const isAccepted = trip.ride_state_vars.isAccepted
                const isPickedUp = trip.ride_state_vars.inRideToDestination
                const isDroppedPassenger = trip.ride_state_vars.isRideCompleted_riderSide
                const isDroppedDriver = trip.ride_state_vars.isRideCompleted_driverSide
                const isArrivedToDestination = trip.isArrivedToDestination
                const connect_type = trip.connect_type
                const payment_method = trip.payment_method
                const amount = trip.fare
                const destinations = trip.destinationData
                //const origin = trip.pickup_location_infos.location_name
                //console.log(trip.client_id)
                // Request for corresponding passenger
                query = {
                    user_fingerprint: trip.client_id
                }
                // Make Database request of corrresponding passenger

                collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user)=> {
                    // initialize the trip details object
                    const tripDetails = {}
                    if (user[0]){
                        const name = user[0]["name"]
                        const surname = user[0]["surname"]
                        const gender = user[0]["gender"]
                        const cellphone = user[0]["phone_number"]
                      
                        //create the Object containing collected data
                        tripDetails.passengers_number = passengers_number
                        tripDetails.request_type = request_type
                        tripDetails.date_time = date_time
                        tripDetails.isAccepted = isAccepted
                        tripDetails.wished_pickup_time = wished_pickup_time
                        tripDetails.isPickedUp = isPickedUp
                        tripDetails.isDroppedPassenger = isDroppedPassenger
                        tripDetails.isDroppedDriver = isDroppedDriver
                        tripDetails.isArrivedToDestination = isArrivedToDestination
                        tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method 
                        tripDetails.amount = amount 
                        tripDetails.destinations = destinations
                        tripDetails.name = name 
                        tripDetails.surname = surname
                        tripDetails.gender = gender
                        tripDetails.cellphone = cellphone 
                        //tripDetails.origin = origin
                        // Add trip detail to final response 
                        res0(tripDetails)
                      
                    } else {
                        //! Set the passenger details to "not found" if fingerprint is 
                        //!   unknown(suspecious case)
                        const name = "not found"
                        const surname = "not found"
                        const gender = "not found"
                        const cellphone = "not found"

                        tripDetails.passengers_number = passengers_number
                        tripDetails.request_type = request_type
                        tripDetails.date_time = date_time
                        tripDetails.isAccepted = isAccepted
                        tripDetails.wished_pickup_time = wished_pickup_time
                        tripDetails.isPickedUp = isPickedUp
                        tripDetails.isDroppedPassenger = isDroppedPassenger
                        tripDetails.isDroppedDriver = isDroppedDriver
                        tripDetails.isArrivedToDestination = isArrivedToDestination
                        tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method 
                        tripDetails.amount = amount 
                        tripDetails.destinations = destinations
                        tripDetails.name = name 
                        tripDetails.surname = surname
                        tripDetails.gender = gender
                        tripDetails.cellphone = cellphone 
                        //tripDetails.origin = origin
                        // Add trip detail to final response 
                        res0(tripDetails)
                    }

                }).catch((error) => { 
                    console.log(error)
                })
              });
          })
          // Get all added objects from res0
          Promise.all(alltrips).then(
              (result) => {
                  console.log(`${result.length} rides found`)
                  resolve(result)
              },
              (error) => {
                  console.log(error)
              }
          )

      })
      .catch((err) => console.log(err))
}



function getDeliveryOverview(collectionRidesDeliveryData, 
  collectionPassengers_profiles,
  resolve ) {
    collectionRidesDeliveryData
      .find({ride_mode:"DELIVERY"})
      .toArray()
      .then((result) => {
          // Initialize the list of all trips
          //console.log(result)
          let alltrips =result.map((trip) => {
              return new Promise((res0) => {
                 
              // Get the following for each trip
                const delivery_receiver = trip.delivery_infos.receiverName_delivery
                const delivery_phone = trip.delivery_infos.receiverPhone_delivery
                
                const request_type = trip.request_type
                const isAccepted = trip.ride_state_vars.isAccepted
                const date_time = trip.date_requested
                const wished_pickup_time = trip.wished_pickup_time
                const isPickedUp = trip.ride_state_vars.inRideToDestination
                const isDroppedPassenger = trip.ride_state_vars.isRideCompleted_riderSide
                const isDroppedDriver = trip.ride_state_vars.isRideCompleted_driverSide
                const payment_method = trip.payment_method
                const amount = trip.fare
                const destinations = trip.destinationData
                
                const origin = trip.pickup_location_infos.location_name
                //console.log(trip.client_id)
                // Request for corresponding passenger
                query = {
                    user_fingerprint: trip.client_id
                }
                // Make Database request of corrresponding passenger

                collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user)=> {
                    // initialize the trip details object
                    const tripDetails = {}
                    if (user[0]){

                        const name = user[0]["name"]
                        const surname = user[0]["surname"]
                        const gender = user[0]["gender"]
                        const cellphone = user[0]["phone_number"]
                      
                        //create the Object containing collected data
                        if (delivery_receiver != false) {
                          tripDetails.delivery_receiver = delivery_receiver
                        }
                        if (delivery_phone != false) {
                          tripDetails.delivery_phone = delivery_phone
                        }
                        tripDetails.request_type = request_type
                        tripDetails.isAccepted = isAccepted
                        tripDetails.wished_pickup_time = wished_pickup_time
                        tripDetails.date_time = date_time
                        tripDetails.isPickedUp = isPickedUp
                        tripDetails.isDroppedPassenger = isDroppedPassenger
                        tripDetails.isDroppedDriver = isDroppedDriver
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method 
                        tripDetails.amount = amount 
                        tripDetails.destinations = destinations
                        tripDetails.name = name 
                        tripDetails.surname = surname
                        tripDetails.gender = gender
                        tripDetails.cellphone = cellphone 
                        tripDetails.origin = origin
                        // Add trip detail to final response 
                        res0(tripDetails)
                      
                    } else {
                        //! Set the sender details to "not found" if fingerprint is 
                        //!   unknown(suspecious case)
                        const name = "not found"
                        const surname = "not found"
                        const gender = "not found"
                        const cellphone = "not found"

                        //tripDetails.passengers_number = passengers_number
                        tripDetails.request_type = request_type
                        tripDetails.isAccepted = isAccepted
                        tripDetails.wished_pickup_time = wished_pickup_time
                        tripDetails.date_time = date_time
                        tripDetails.isPickedUp = isPickedUp
                        tripDetails.isDroppedPassenger = isDroppedPassenger
                        tripDetails.isDroppedDriver = isDroppedDriver
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method 
                        tripDetails.amount = amount 
                        tripDetails.destinations = destinations
                        tripDetails.name = name 
                        tripDetails.surname = surname
                        tripDetails.gender = gender
                        tripDetails.cellphone = cellphone 
                        tripDetails.origin = origin
                        // Add trip detail to final response 
                        res0(tripDetails)
                    }

                }).catch((error) => { 
                    console.log(error)
                })
              });
          })
          // Get all added objects from res0
          Promise.all(alltrips).then(
              (result) => {
                  console.log(`${result.length}Deliveries found`)
                  resolve(result)
              },
              (error) => {
                  console.log(error)
              }
          )

      })
      .catch((err) => console.log(err))
}




//! Functions dealing with partners data:

/**
 * @function OverallmoneyPartner : returns an object of total money made so far and daily total
 *                               Keys: total and totalToday
 * @param {array} driversList: An array list of objects with a key value: totalmoney  
 *                              Where "totalmoney" is a numerical value
 * @param {return} resolve 
 */

function OverallmoneyPartner(driversList, resolve) {
  let total = []
  let totalToday = []
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0)

  driversList.map((driver) => {
      total.push(Number(driver["totalmoney"]))
      totalToday.push(Number(driver["totalMoneyToday"]))
  })

  let totalMoney = {
      total: Sum(total),
      totalToday: Sum(totalToday)

  }

  resolve(totalMoney)
}
/**
* 
* @param {array} arrayData : An array of objects from the rides/deliveries collection 

*/
function GetCashWallet(arrayData, resolve) {

  let fare_array = [];
  let fare_array_cash = [];
  let fare_array_wallet = [];
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);
  
  arrayData.map((ride) => {
      fare_array.push(Number(ride["fare"]));

      // Get rides with CASH as payment method
      let payment_method = ride["payment_method"].toUpperCase().trim();
      if (/CASH/i.test(payment_method)) {
      // if (payment_method ==="CASH") /CASH/ makes sure of spacing
      fare_array_cash.push(Number(ride["fare"]));
      } else {
      fare_array_wallet.push(Number(ride["fare"]));
      }
  });
  
  let totalCash = Sum(fare_array_cash);
  let totalWallet = Sum(fare_array_wallet);
  let totalCashWallet = totalCash + totalWallet;
  let CashWalletObject = { totalCash, totalWallet, totalCashWallet };

  resolve(CashWalletObject)

  //return CashWalletObject
}
/**
* 
* @param {collection} DriversCollection 
* @param {collection} FilteringCollection: The rides/deliveries collection
* @param {string} deliveryProviderName : The name of the delivery provider as 
*                                          As registered at delivery_provider param
* 
*/

function getDeliveryProviderInfo(DriversCollection,FilteringCollection,deliveryProviderName, resolve) {

  DriversCollection
  .find(query = {
      "operation_clearances": "Delivery",
      delivery_provider: deliveryProviderName
  })
  .toArray()
  .then((individualsList) => {
      
      let drivers = individualsList.map((individual) => {
          return new Promise((outcome) => {
              // Get the following:
              const name = individual.name
              const surname = individual.surname
              const phone_number = individual.phone_number
              const taxi_number = individual.cars_data[0].taxi_number
              const plate_number = individual.cars_data[0].plate_number
              const car_brand = individual.cars_data[0].car_brand
              const status = individual.operational_state.status
              
              //Query for this individual's completed rides
              query = {
                  taxi_id: individual.driver_fingerprint,
                  isArrivedToDestination: true
              }
              
              FilteringCollection
              .find(query)
              .toArray()
              .then((result) => {
                  
                  const totaltrip = result.length

                  //Make computation to get corresponding total money made
                  new Promise((res) => {
                      GetCashWallet(result, res)
                  }).then((futuremoney) => {
                      const totalmoney = futuremoney.totalCashWallet

                      // Get today's data:
                      let startOfToday = new Date()
                      startOfToday.setHours(0, 0, 0, 0)
                      
                      FilteringCollection
                      .find( {
                          taxi_id: individual.driver_fingerprint,
                          isArrivedToDestination: true,
                          date_requested: { $gte: startOfToday }
                      })
                      .toArray()
                      .then((todaydata) => {
                          const todaytrip = todaydata.length

                          new Promise((res) => {
                              GetCashWallet(todaydata, res)
                          }).then((todaymoney) => {

                              const todayTotalMoney = todaymoney.totalCashWallet

                              // Initialize Individual data
                              let Individual_driver = {}

                              // Append data to the Individual driver Object:
                              Individual_driver.name = name
                              Individual_driver.surname = surname
                              Individual_driver.phone_number = phone_number
                              Individual_driver.taxi_number = taxi_number
                              Individual_driver.plate_number = plate_number
                              Individual_driver.car_brand = car_brand
                              Individual_driver.status = status
                              Individual_driver.totaltrip = totaltrip
                              Individual_driver.totalmoney = totalmoney
                              Individual_driver.todaytrip = todaytrip
                              Individual_driver.totalMoneyToday = todayTotalMoney

                              outcome(Individual_driver)


                          }).catch((error) => {
                              console.log(error)
                          })

                      }).catch((error) => {
                          console.log(error)
                      })                        

                  }).catch((error) => {
                      console.log(error)
                      
                  })

                  
              }).catch((error) => {
                  console.log(error)
              })
          })
      })
      Promise.all(drivers).then(
          (result) => {
              // Get total money made by drivers:
              new Promise((res) => {
                  OverallmoneyPartner(result, res)
              }).then((future) => {
                  
                  let driverAll = {
                      drivers_list: result,
                      drivers_count : result.length,
                      total_money: future.total,
                      total_money_today: future.totalToday    
                  }
                  resolve(driverAll)

              }).catch((error) => {
                  console.log(error)
              })
              
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


function getOwners(ownersCollection, resolve) {
  ownersCollection
  .find({})
  .toArray()
  .then((owners) => {
    let ownersData = owners.map((owner) => {
      return new Promise((outcome) => {

          const name = owner.name
          const email = owner.email
          const password = owner.password

          const ownerData =  {
              name: name,
              email: email,
              password: password 
          }

          outcome(ownerData)
      })
    })
    Promise.all(ownersData)
    .then(
        (result) => {
            resolve(result)
        },
        (error) => {
            console.log(error)
            resolve({ response: "error", flag: "Wrong parameters maybe"})
        }
    )
  })
}
/**
 * @function userExists : Authenticates the delivery provider
 * @param {string} email 
 * @param {string} password 
 * @param {array} providers 
 */
function userExists(provider, email, password, providers, resolve) {
  resolve( providers.some(function(el) {
    return (el.email === email && el.password === password && el.name === provider)
    })
  )
}
/*
* Testing the function 
console.log(userExists("deliveryGuy", "delivery@guy","12345678",[
  {
    name: "ebikesForAfrica",
    email: "ebikes@africa",
    password: "12345678"
  },
  {
    name: "deliveryGuy", 
    email: "delivery@guy",
    password: "12345678" 
  }
])  )  */   
//! End of partners functions' data

// All APIs : 

clientMongo.connect(function (err) {
  //if (err) throw err;

  const dbMongo = clientMongo.db(dbName);
  const collectionPassengers_profiles = dbMongo.collection(
    "passengers_profiles"
  );
  const collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
  const collectionRidesDeliveryData = dbMongo.collection(
    "rides_deliveries_requests"
  );
  const collectionRidesDeliveryDataCancelled = dbMongo.collection(
    "cancelled_rides_deliveries_requests"
  );
  const collectionOwners = dbMongo.collection("owners_profiles") 
  //? INITIALIZE EXPRESS ONCE
  app
    .get("/", (req, res) => {
      //!DO NOT SEND AN ANSWER FROM THE ROOT PATH
      console.log("All is good at main view server");
    })
    .use(express.json())
    .use(express.urlencoded({ extended: true }));

  /**
   * ALL THE APIs ROUTES FOR THIS SERVICE.
   * ! Comment the top of each API
   */

  /**
   * 1. API responsible for getting all the general statistics.
   * @param: some params that this API is expecting...
   */
  app.get("/statistics", (req, res) => {
    console.log("Statistics API called!");
    new Promise((res) => {
      activelyGet_allThe_stats(
        collectionRidesDeliveryData,
        collectionRidesDeliveryDataCancelled,
        collectionDrivers_profiles,
        collectionPassengers_profiles,
        res
      );
    }).then(
      (result) => {
        console.log(result);
        res.send(result);
      },
      (error) => {
        console.log(error);
        res.send({ response: "error", flag: "Invalid_params_maybe" });
      }
    );
  });

  /**
   * 2. API responsible for getting rides 
   * !except cancelled rides
   */
  app.get("/ride-overview", (req,res) => {
    console.log("Ride overview API called!!")
    new Promise((res) => {
      getRideOverview(
        collectionRidesDeliveryData, 
        collectionPassengers_profiles,
        res )
    }).then( 
      (result) => {
        console.log(result)
        res.send(result)
      },
      (error) => {
        console.log(error)
        res.send({ response: "error", flag: "Something went wrong, could be Invalid parameters"})
      }
    )

  })

  /**
   * API responsible of getting all deliveries data
   */
  app.get("/delivery-overview", (req,res) => {
    console.log("Delivery overview API called delivery!!")
    new Promise((res) => {
      getDeliveryOverview(
        collectionRidesDeliveryData, 
        collectionPassengers_profiles,
        res )
    }).then(
      (result) => {
        console.log(result)
        res.send(result)
      },
      (error) => {
        console.log(error)
        res.send({ response: "error", flag: "Something went wrong, could be Invalid parameters"})
      }
    )

  })

  /**
   * API responsible of getting the partners data (delivery providers)
   */

   app.get("/delivery-provider-data/:provider/:email/:password", (req, res) => {
     
      let response = res
      // Get the received parameter 
      let providerName = req.params.provider
      let providerEmail = req.params.email
      let providerPassword = req.params.password
      console.log(`Delivery provider API called by: ${ providerName }`)
     
      new Promise((res) => {
        getOwners(collectionOwners, res)
      }).then((ownersList) => {
    
        Promise.all([
          new Promise((res) => {
            // Ckeck promise
            userExists(req.params.provider, req.params.email, req.params.password, ownersList, res)
          }),
          new Promise((res) => {
            getDeliveryProviderInfo(collectionDrivers_profiles, collectionRidesDeliveryData, req.params.provider, res)
          })
        ])
        .then((result) => {
  
          [checkResponse, deliveryInfo] = result
       
          if (checkResponse) {
            response.send(deliveryInfo)
            console.log(result)
          } else {
            response.status(400).send({
              message: "Wrong credentials"
            })
          }
  
        }).catch((error) => {
          console.log(error)
          response.send({ response: "error", flag: "Something went wrong, could be Invalid parameters"})
        })
      }).catch((error) => {
        console.log(error)
        response.status(400).send({message: "Something went wrong"})
      })
      
        
   })
});


app.listen(PORT, () => {
  console.log(`Main view server up and running at port ${PORT}`);
});
