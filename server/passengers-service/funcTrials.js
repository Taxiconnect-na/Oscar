// Mongodb Connection
const { logger } = require("../LogService");
const MongoClient = require("mongodb").MongoClient;
const uri = "mongodb://localhost:27017";
//const uri = "mongodb+srv://taxiconnect-test-mongo-user:epzcVtEZ39ZvawlM@cluster0.cumod.mongodb.net/test?authSource=admin&replicaSet=atlas-13sofg-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true"
const clientMongo = new MongoClient(uri, {
  useUnifiedTopology: true,
});
const dbName = "Taxiconnect";

const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

//* Check whether object is date or not
var is_date = function (input) {
  if (Object.prototype.toString.call(input) === "[object Date]") return true;
  return false;
};

Array.prototype.groupBy = function (field) {
  let groupedArr = [];
  this.forEach(function (e) {
    //look for an existent group
    let group = groupedArr.find((g) => g["field"] === e[field]);
    if (group == undefined) {
      //add new group if it doesn't exist
      group = { field: e[field], groupList: [] };
      groupedArr.push(group);
    }

    //add the element to the group
    group.groupList.push(e);
  });

  return groupedArr;
};

function getDayName(number) {
  switch (number) {
    case 0:
      return "Sun";
      break;
    case 1:
      return "Mon";
      break;
    case 2:
      return "Tue";
      break;
    case 3:
      return "Wed";
      break;
    case 4:
      return "Thu";
      break;
    case 5:
      return "Fri";
      break;
    case 6:
      return "Sat";
      break;
  }
}

function getCancelledDeliveries(
  collectionCancelledRides,
  collectionPassengers,
  collectionDrivers,
  resolve
) {
  // Attempt to get data from cache first
  client.get("cancelledRides-cache", (err, reply) => {
    logger.info("looking for data in redis...");

    if (err) {
      logger.info(err);
      // Function to get data directly from Mongo
      collectionCancelledRides
        .find({ ride_mode: "DELIVERY" })
        //.sort({date_requested: -1})
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested;
              const passengers_number = cancelled.passengers_number;
              const connect_type = cancelled.connect_type;
              const origin = cancelled.pickup_location_infos.suburb;
              const destination = cancelled.destinationData.map(
                (destination) => {
                  return destination.suburb;
                }
              );
              const fare = cancelled.fare;

              queryPassenger = { user_fingerprint: cancelled.client_id };
              //Get passenger Data
              collectionPassengers
                .findOne(queryPassenger)
                .then((passenger) => {
                  const passenger_name = passenger
                    ? passenger.name
                    : "not found";
                  const passenger_phone_number = passenger
                    ? passenger.phone_number
                    : "not found";
                  // Get the driver info in case ride was accepted before cancellation
                  if (cancelled.taxi_id) {
                    collectionDrivers
                      .findOne({ driver_fingerprint: cancelled.taxi_id })
                      .then((driver) => {
                        const taxi_number = driver
                          ? driver.cars_data[0]["taxi_number"]
                          : "not found";
                        const driver_name = driver ? driver.name : "not found";

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
                        });
                      })
                      .catch((error) => {
                        logger.info(error);
                        resolve({
                          error: "something went wrong @Driver collection",
                        });
                      });
                  } else {
                    const taxi_number = "N/A";
                    const driver_name = "N/A";

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
                    });
                  }
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({
                    error: "something went wrong@passengerCollection",
                  });
                });
            });
          });
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              logger.info("No cash was found for cancelled rides");
              client.setex(
                "cancelledRides-cache",
                600000,
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
              resolve({ error: "Did not manage to get all promises" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
        });
    } else if (reply) {
      if (reply !== null) {
        // return cached data
        resolve(JSON.parse(reply));

        //! Update cache in background
        // Function to get data directly from Mongo
        new Promise((cashupdateInBackground) => {
          collectionCancelledRides
            .find({ ride_mode: "RIDE" })
            .sort({ date_requested: -1 })
            .limit(100)
            .toArray()
            .then((result) => {
              // Map through all cancelled ride and return needed info/field
              let allCancelled = result.map((cancelled) => {
                return new Promise((response) => {
                  // Get the following for each ride
                  const date_requested = cancelled.date_requested;
                  const passengers_number = cancelled.passengers_number;
                  const connect_type = cancelled.connect_type;
                  const origin = cancelled.pickup_location_infos.suburb;
                  const destination = cancelled.destinationData.map(
                    (destination) => {
                      return destination.suburb;
                    }
                  );
                  const fare = cancelled.fare;

                  queryPassenger = { user_fingerprint: cancelled.client_id };
                  //Get passenger Data
                  collectionPassengers
                    .findOne(queryPassenger)
                    .then((passenger) => {
                      const passenger_name = passenger
                        ? passenger.name
                        : "not found";
                      const passenger_phone_number = passenger
                        ? passenger.phone_number
                        : "not found";
                      // Get the driver info in case ride was accepted before cancellation
                      if (cancelled.taxi_id) {
                        collectionDrivers
                          .findOne({ driver_fingerprint: cancelled.taxi_id })
                          .then((driver) => {
                            const taxi_number = driver
                              ? driver.cars_data[0]["taxi_number"]
                              : "not found";
                            const driver_name = driver
                              ? driver.name
                              : "not found";

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
                            });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              error: "something went wrong @Driver collection",
                            });
                          });
                      } else {
                        const taxi_number = "N/A";
                        const driver_name = "N/A";

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
                        });
                      }
                    })
                    .catch((error) => {
                      logger.info(error);
                      resolve({
                        error: "something went wrong@passengerCollection",
                      });
                    });
                });
              });
              // Get all resulting cancelled rides
              Promise.all(allCancelled).then(
                (result) => {
                  logger.info("No cash was found for cancelled rides");
                  client.setex(
                    "cancelledRides-cache",
                    600000,
                    JSON.stringify(result),
                    redis.print
                  );
                  //! No resolve
                },
                (error) => {
                  logger.info(error);
                  resolve({ error: "Did not manage to get all promises" });
                }
              );
            });
        });
      } else {
        // Function to get data directly from Mongo
        collectionCancelledRides
          .find({ ride_mode: "RIDE" })
          .sort({ date_requested: -1 })
          .limit(100)
          .toArray()
          .then((result) => {
            // Map through all cancelled ride and return needed info/field
            let allCancelled = result.map((cancelled) => {
              return new Promise((response) => {
                // Get the following for each ride
                const date_requested = cancelled.date_requested;
                const passengers_number = cancelled.passengers_number;
                const connect_type = cancelled.connect_type;
                const origin = cancelled.pickup_location_infos.suburb;
                const destination = cancelled.destinationData.map(
                  (destination) => {
                    return destination.suburb;
                  }
                );
                const fare = cancelled.fare;

                queryPassenger = { user_fingerprint: cancelled.client_id };
                //Get passenger Data
                collectionPassengers
                  .findOne(queryPassenger)
                  .then((passenger) => {
                    const passenger_name = passenger
                      ? passenger.name
                      : "not found";
                    const passenger_phone_number = passenger
                      ? passenger.phone_number
                      : "not found";
                    // Get the driver info in case ride was accepted before cancellation
                    if (cancelled.taxi_id) {
                      collectionDrivers
                        .findOne({ driver_fingerprint: cancelled.taxi_id })
                        .then((driver) => {
                          const taxi_number = driver
                            ? driver.cars_data[0]["taxi_number"]
                            : "not found";
                          const driver_name = driver
                            ? driver.name
                            : "not found";

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
                          });
                        })
                        .catch((error) => {
                          logger.info(error);
                          resolve({
                            error: "something went wrong @Driver collection",
                          });
                        });
                    } else {
                      const taxi_number = "N/A";
                      const driver_name = "N/A";

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
                      });
                    }
                  })
                  .catch((error) => {
                    logger.info(error);
                    resolve({
                      error: "something went wrong@passengerCollection",
                    });
                  });
              });
            });
            // Get all resulting cancelled rides
            Promise.all(allCancelled).then(
              (result) => {
                logger.info("No cash was found for cancelled rides");
                resolve(result);
              },
              (error) => {
                logger.info(error);
                resolve({ error: "Did not manage to get all promises" });
              }
            );
          })
          .catch((error) => {
            logger.info(error);
          });
      }
    } else {
      // Function to get data directly from Mongo
      collectionCancelledRides
        .find({ ride_mode: "RIDE" })
        .sort({ date_requested: -1 })
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested;
              const passengers_number = cancelled.passengers_number;
              const connect_type = cancelled.connect_type;
              const origin = cancelled.pickup_location_infos.suburb;
              const destination = cancelled.destinationData.map(
                (destination) => {
                  return destination.suburb;
                }
              );
              const fare = cancelled.fare;

              queryPassenger = { user_fingerprint: cancelled.client_id };
              //Get passenger Data
              collectionPassengers
                .findOne(queryPassenger)
                .then((passenger) => {
                  const passenger_name = passenger
                    ? passenger.name
                    : "not found";
                  const passenger_phone_number = passenger
                    ? passenger.phone_number
                    : "not found";
                  // Get the driver info in case ride was accepted before cancellation
                  if (cancelled.taxi_id) {
                    collectionDrivers
                      .findOne({ driver_fingerprint: cancelled.taxi_id })
                      .then((driver) => {
                        const taxi_number = driver
                          ? driver.cars_data[0]["taxi_number"]
                          : "not found";
                        const driver_name = driver ? driver.name : "not found";

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
                        });
                      })
                      .catch((error) => {
                        logger.info(error);
                        resolve({
                          error: "something went wrong @Driver collection",
                        });
                      });
                  } else {
                    const taxi_number = "N/A";
                    const driver_name = "N/A";

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
                    });
                  }
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({
                    error: "something went wrong@passengerCollection",
                  });
                });
            });
          });
          // Get all resulting cancelled rides
          Promise.all(allCancelled).then(
            (result) => {
              logger.info("No cash was found for cancelled rides");
              client.setex(
                "cancelledRides-cache",
                600000,
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
              resolve({ error: "Did not manage to get all promises" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
        });
    }
  });
}

clientMongo.connect(function () {
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
  const collectionOwners = dbMongo.collection("owners_profiles");

  const collectionAdminUsers = dbMongo.collection("internal_admin_users");

  // Filtering query
  const query = {
    ride_mode: "RIDE",
    isArrivedToDestination: true,
    "ride_state_vars.isRideCompleted_riderSide": true,
    "ride_state_vars.isRideCompleted_driverSide": true,
  };
  new Promise((fire) => {
    getCancelledDeliveries(
      collectionRidesDeliveryDataCancelled,
      collectionPassengers_profiles,
      collectionDrivers_profiles,
      fire
    );
  }).then((result) => {
    logger.info(result);
  });
});
