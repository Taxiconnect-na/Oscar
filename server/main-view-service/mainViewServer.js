require("newrelic");
const path = require("path");
require("dotenv").config({ path: __dirname + "/./../.env" });
const fs = require("fs");
const certFile = fs.readFileSync(String(process.env.CERT_FILE));

const { logger } = require("../LogService");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const urlParser = require("url");
// Set up redis
const redis = require("redis");
var otpGenerator = require("otp-generator");
const moment = require("moment");

const client = /production/i.test(String(process.env.EVIRONMENT))
  ? null
  : redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });

var RedisClustr = require("redis-clustr");
var redisCluster = /production/i.test(String(process.env.EVIRONMENT))
  ? new RedisClustr({
      servers: [
        {
          host: process.env.REDIS_HOST_ELASTICACHE,
          port: process.env.REDIS_PORT_ELASTICACHE,
        },
      ],
      createClient: function (port, host) {
        // this is the default behaviour
        return redis.createClient(port, host);
      },
    })
  : client;

//! Error handling redis Error
redisCluster.on("error", function (er) {
  console.trace("Main view server connection to redis failed ");
  logger.error(er.stack);
});

function resolveDate() {
  //Resolve date
  var date = new Date();
  date = moment(date.getTime()).utcOffset(2);

  dateObject = date;
  date =
    date.year() +
    "-" +
    (date.month() + 1) +
    "-" +
    date.date() +
    " " +
    date.hour() +
    ":" +
    date.minute() +
    ":" +
    date.second();
  chaineDateUTC = new Date(date).toISOString();
}
resolveDate();

const http = require("http");
const { resolve } = require("path");
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(
  express.json({
    extended: true,
    limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS,
  })
);

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
//* Windhoek Date and Time
var windhoekDateTime = new Date(new Date().toUTCString()).addHours(2);
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
      //logger.info(`Total fare: ${total_fare}`)
      //total rides
      total_rides = result.length;
      totalObject = { total_fare, total_rides };
      resolve(totalObject);
      //logger.info(`total rides: ${total_rides}`)
    })
    .catch((error) => {
      logger.info(error);
    });
}

function GetDailyRegistered(collectionName, resolve) {
  let startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  collectionName
    .find({ date_registered: { $gte: startOfToday.addHours(2) } })
    .toArray()
    .then((result) => {
      let totalRegisteredToday = new Object();
      totalRegisteredToday.totalRegisteredToday = result.length;
      resolve(totalRegisteredToday);
    })
    .catch((err) => logger.info(err));
}

function GetCashWalletCollection(collectionName, resolve) {
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
    .catch((err) => logger.info(err));
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
  redisCluster.get("statistics-cache", (err, reply) => {
    // Get Data from db and save it in cache if there's an error
    if (err) {
      logger.info("Error occured");
      logger.info(err);

      let finalObject = new Object();
      new Promise((res) => {
        GetTotal(
          collectionRidesDeliveryData,
          { isArrivedToDestination: true },
          res
        );
      })
        .then((result) => {
          //logger.info(result);
          new Promise((res) => {
            GetTotal(collectionRidesDeliveryDataCancelled, {}, res);
          })
            .then((result2) => {
              //logger.info(result2);
              Fullcollect = { result, result2 };
              logger.info(`Final: ${Fullcollect}`);
              //let finalObject = new Object()

              let startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              new Promise((res) => {
                GetTotal(
                  collectionRidesDeliveryData,
                  {
                    date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2

                    isArrivedToDestination: true,
                  },
                  res
                );
              })
                .then((result3) => {
                  logger.info(result3);

                  logger.info(finalObject);
                  new Promise((res) => {
                    GetTotal(
                      collectionRidesDeliveryDataCancelled,
                      {
                        date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2
                        //date_requested: {
                        //$regex: new Date().toISOString().replace(/\T.*/, " "),
                        //$options: "i",
                      },
                      res
                    );
                  })
                    .then((result4) => {
                      logger.info(result4);

                      Promise.all([
                        new Promise((res) => {
                          GetDailyRegistered(collectionDrivers_profiles, res);
                        }),
                        new Promise((res) => {
                          GetDailyRegistered(
                            collectionPassengers_profiles,
                            res
                          );
                        }),
                        new Promise((res) => {
                          GetCashWalletCollection(
                            collectionRidesDeliveryData,
                            res
                          );
                        }),
                      ])
                        .then((data) => {
                          let [dataDriver, dataPassenger, dataCashWallet] =
                            data;

                          finalObject.totalFareSuccessful = result.total_fare;
                          finalObject.totalTripSuccessful = result.total_rides;
                          finalObject.totalFareCancelled = result2.total_fare;
                          finalObject.totalTripCancelled = result2.total_rides;
                          finalObject.totalFareSuccessfulToday =
                            result3.total_fare;
                          finalObject.totalTripSuccessfulToday =
                            result3.total_rides;
                          finalObject.totalFareCancelledToday =
                            result4.total_fare;
                          finalObject.totalTripCancelledToday =
                            result4.total_rides;
                          finalObject.totalNewDriverToday =
                            dataDriver.totalRegisteredToday;
                          finalObject.totalNewPassengerToday =
                            dataPassenger.totalRegisteredToday;
                          finalObject.totalCash = dataCashWallet.totalCash;
                          finalObject.totalWallet = dataCashWallet.totalWallet;

                          //Done
                          logger.info(finalObject);

                          //? Cache final object:
                          redisCluster.setex(
                            "statistics-cache",
                            600000,
                            JSON.stringify(finalObject),
                            redis.print
                          );

                          //? resolve the main object with the successfull request
                          resolve(finalObject);
                        })
                        .catch((error) => {
                          logger.info(error);
                          //! Return an error response
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      //! Return an error response
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  //! Return an error response
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            })
            .catch((error) => {
              logger.info(error);
              //! Return an error response
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            });
        })
        .catch((error) => {
          logger.info(error);
          //! Return an error response
          resolve({ response: "error", flag: "Invalid_params_maybe" });
        });
    } else if (reply) {
      // Resolve reply first and then update cache if result is not null
      if (reply !== null) {
        //logger.info("Statistics cache found: ", reply)

        resolve(JSON.parse(reply));

        //Update cache
        new Promise((statsCashUpdate) => {
          let finalObject = new Object();
          new Promise((res) => {
            GetTotal(
              collectionRidesDeliveryData,
              { isArrivedToDestination: true },
              res
            );
          })
            .then((result) => {
              logger.info(result);
              new Promise((res) => {
                GetTotal(collectionRidesDeliveryDataCancelled, {}, res);
              })
                .then((result2) => {
                  logger.info(result2);
                  Fullcollect = { result, result2 };
                  logger.info(`Final: ${Fullcollect}`);
                  //let finalObject = new Object()

                  let startOfToday = new Date();
                  startOfToday.setHours(0, 0, 0, 0);
                  new Promise((res) => {
                    GetTotal(
                      collectionRidesDeliveryData,
                      {
                        date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2

                        isArrivedToDestination: true,
                      },
                      res
                    );
                  })
                    .then((result3) => {
                      logger.info(result3);

                      logger.info(finalObject);
                      new Promise((res) => {
                        GetTotal(
                          collectionRidesDeliveryDataCancelled,
                          {
                            date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2
                            //date_requested: {
                            //$regex: new Date().toISOString().replace(/\T.*/, " "),
                            //$options: "i",
                          },
                          res
                        );
                      })
                        .then((result4) => {
                          logger.info(result4);

                          Promise.all([
                            new Promise((res) => {
                              GetDailyRegistered(
                                collectionDrivers_profiles,
                                res
                              );
                            }),
                            new Promise((res) => {
                              GetDailyRegistered(
                                collectionPassengers_profiles,
                                res
                              );
                            }),
                            new Promise((res) => {
                              GetCashWalletCollection(
                                collectionRidesDeliveryData,
                                res
                              );
                            }),
                          ])
                            .then((data) => {
                              let [dataDriver, dataPassenger, dataCashWallet] =
                                data;

                              finalObject.totalFareSuccessful =
                                result.total_fare;
                              finalObject.totalTripSuccessful =
                                result.total_rides;
                              finalObject.totalFareCancelled =
                                result2.total_fare;
                              finalObject.totalTripCancelled =
                                result2.total_rides;
                              finalObject.totalFareSuccessfulToday =
                                result3.total_fare;
                              finalObject.totalTripSuccessfulToday =
                                result3.total_rides;
                              finalObject.totalFareCancelledToday =
                                result4.total_fare;
                              finalObject.totalTripCancelledToday =
                                result4.total_rides;
                              finalObject.totalNewDriverToday =
                                dataDriver.totalRegisteredToday;
                              finalObject.totalNewPassengerToday =
                                dataPassenger.totalRegisteredToday;
                              finalObject.totalCash = dataCashWallet.totalCash;
                              finalObject.totalWallet =
                                dataCashWallet.totalWallet;

                              //Done
                              //logger.info(finalObject);

                              //? Cache final object:
                              redisCluster.setex(
                                "statistics-cache",
                                600000,
                                JSON.stringify(finalObject),
                                redis.print
                              );

                              //! Do not resolve the main object with the successfull request
                            })
                            .catch((error) => {
                              logger.info(error);
                              //! Return an error response
                              resolve({
                                response: "error",
                                flag: "Invalid_params_maybe",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.info(error);
                          //! Return an error response
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      //! Return an error response
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  //! Return an error response
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            })
            .catch((error) => {
              logger.info(error);
              //! Return an error response
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            });
        })
          .then((result) => {
            logger.info("Stats cash updated");
          })
          .catch((error) => {
            logger.info(error);
            resolve({
              response: "error",
              flag: "Failed to update cache @background",
            });
          });
      } else {
        logger.info("NO cash found, requesting from db...");

        let finalObject = new Object();
        new Promise((res) => {
          GetTotal(
            collectionRidesDeliveryData,
            { isArrivedToDestination: true },
            res
          );
        })
          .then((result) => {
            logger.info(result);
            new Promise((res) => {
              GetTotal(collectionRidesDeliveryDataCancelled, {}, res);
            })
              .then((result2) => {
                //logger.info(result2);
                Fullcollect = { result, result2 };
                //logger.info(`Final: ${Fullcollect}`);
                //let finalObject = new Object()

                let startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                new Promise((res) => {
                  GetTotal(
                    collectionRidesDeliveryData,
                    {
                      date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2

                      isArrivedToDestination: true,
                    },
                    res
                  );
                })
                  .then((result3) => {
                    //logger.info(result3);

                    //logger.info(finalObject);
                    new Promise((res) => {
                      GetTotal(
                        collectionRidesDeliveryDataCancelled,
                        {
                          date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2
                          //date_requested: {
                          //$regex: new Date().toISOString().replace(/\T.*/, " "),
                          //$options: "i",
                        },
                        res
                      );
                    })
                      .then((result4) => {
                        //logger.info(result4);

                        Promise.all([
                          new Promise((res) => {
                            GetDailyRegistered(collectionDrivers_profiles, res);
                          }),
                          new Promise((res) => {
                            GetDailyRegistered(
                              collectionPassengers_profiles,
                              res
                            );
                          }),
                          new Promise((res) => {
                            GetCashWalletCollection(
                              collectionRidesDeliveryData,
                              res
                            );
                          }),
                        ])
                          .then((data) => {
                            let [dataDriver, dataPassenger, dataCashWallet] =
                              data;

                            finalObject.totalFareSuccessful = result.total_fare;
                            finalObject.totalTripSuccessful =
                              result.total_rides;
                            finalObject.totalFareCancelled = result2.total_fare;
                            finalObject.totalTripCancelled =
                              result2.total_rides;
                            finalObject.totalFareSuccessfulToday =
                              result3.total_fare;
                            finalObject.totalTripSuccessfulToday =
                              result3.total_rides;
                            finalObject.totalFareCancelledToday =
                              result4.total_fare;
                            finalObject.totalTripCancelledToday =
                              result4.total_rides;
                            finalObject.totalNewDriverToday =
                              dataDriver.totalRegisteredToday;
                            finalObject.totalNewPassengerToday =
                              dataPassenger.totalRegisteredToday;
                            finalObject.totalCash = dataCashWallet.totalCash;
                            finalObject.totalWallet =
                              dataCashWallet.totalWallet;

                            //Done
                            //logger.info(finalObject);

                            //? Cache final object:
                            redisCluster.setex(
                              "statistics-cache",
                              600000,
                              JSON.stringify(finalObject),
                              redis.print
                            );

                            //? resolve the main object with the successfull request
                            resolve(finalObject);
                          })
                          .catch((error) => {
                            logger.info(error);
                            //! Return an error response
                            resolve({
                              response: "error",
                              flag: "Invalid_params_maybe",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.info(error);
                        //! Return an error response
                        resolve({
                          response: "error",
                          flag: "Invalid_params_maybe",
                        });
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                    //! Return an error response
                    resolve({
                      response: "error",
                      flag: "Invalid_params_maybe",
                    });
                  });
              })
              .catch((error) => {
                logger.info(error);
                //! Return an error response
                resolve({ response: "error", flag: "Invalid_params_maybe" });
              });
          })
          .catch((error) => {
            logger.info(error);
            //! Return an error response
            resolve({ response: "error", flag: "Invalid_params_maybe" });
          });
      }
    } else {
      logger.info("Error occured");

      let finalObject = new Object();
      new Promise((res) => {
        GetTotal(
          collectionRidesDeliveryData,
          { isArrivedToDestination: true },
          res
        );
      })
        .then((result) => {
          logger.info(result);
          new Promise((res) => {
            GetTotal(collectionRidesDeliveryDataCancelled, {}, res);
          })
            .then((result2) => {
              //logger.info(result2);
              Fullcollect = { result, result2 };
              logger.info(`Final: ${Fullcollect}`);
              //let finalObject = new Object()

              let startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              new Promise((res) => {
                GetTotal(
                  collectionRidesDeliveryData,
                  {
                    date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2

                    isArrivedToDestination: true,
                  },
                  res
                );
              })
                .then((result3) => {
                  //logger.info(result3);

                  logger.info(finalObject);
                  new Promise((res) => {
                    GetTotal(
                      collectionRidesDeliveryDataCancelled,
                      {
                        date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2
                        //date_requested: {
                        //$regex: new Date().toISOString().replace(/\T.*/, " "),
                        //$options: "i",
                      },
                      res
                    );
                  })
                    .then((result4) => {
                      //logger.info(result4);

                      Promise.all([
                        new Promise((res) => {
                          GetDailyRegistered(collectionDrivers_profiles, res);
                        }),
                        new Promise((res) => {
                          GetDailyRegistered(
                            collectionPassengers_profiles,
                            res
                          );
                        }),
                        new Promise((res) => {
                          GetCashWalletCollection(
                            collectionRidesDeliveryData,
                            res
                          );
                        }),
                      ])
                        .then((data) => {
                          let [dataDriver, dataPassenger, dataCashWallet] =
                            data;

                          finalObject.totalFareSuccessful = result.total_fare;
                          finalObject.totalTripSuccessful = result.total_rides;
                          finalObject.totalFareCancelled = result2.total_fare;
                          finalObject.totalTripCancelled = result2.total_rides;
                          finalObject.totalFareSuccessfulToday =
                            result3.total_fare;
                          finalObject.totalTripSuccessfulToday =
                            result3.total_rides;
                          finalObject.totalFareCancelledToday =
                            result4.total_fare;
                          finalObject.totalTripCancelledToday =
                            result4.total_rides;
                          finalObject.totalNewDriverToday =
                            dataDriver.totalRegisteredToday;
                          finalObject.totalNewPassengerToday =
                            dataPassenger.totalRegisteredToday;
                          finalObject.totalCash = dataCashWallet.totalCash;
                          finalObject.totalWallet = dataCashWallet.totalWallet;

                          //Done
                          logger.info(finalObject);

                          //? Cache final object:
                          redisCluster.setex(
                            "statistics-cache",
                            600000,
                            JSON.stringify(finalObject),
                            redis.print
                          );

                          //? resolve the main object with the successfull request
                          resolve(finalObject);
                        })
                        .catch((error) => {
                          logger.info(error);
                          //! Return an error response
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      //! Return an error response
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  //! Return an error response
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            })
            .catch((error) => {
              logger.info(error);
              //! Return an error response
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            });
        })
        .catch((error) => {
          logger.info(error);
          //! Return an error response
          resolve({ response: "error", flag: "Invalid_params_maybe" });
        });
    }
  });
}

/**
 * @function getRideOverview
 * @param collectionRidesDeliveryData : collection of all rides and delivery requests
 * @param collectionPassengers_profiles : collection of all passenger profiles
 */

function getRideOverview(
  collectionRidesDeliveryData,
  collectionPassengers_profiles,
  collectionDrivers_profiles,
  resolve
) {
  // Attempt to get data from cache first, if fail, get from mongodb
  redisCluster.get("rideOverview-cache", (err, reply) => {
    logger.info("looking for data in redis...");
    //logger.info("Found ride cache: ", reply)

    if (err) {
      // Get directly from mongodb
      collectionRidesDeliveryData
        .find({ ride_mode: "RIDE" })
        .sort({ date_requested: -1 })
        .limit(200)
        .toArray()
        .then((result) => {
          // Initialize the list of all trips
          //logger.info(result)
          let alltrips = result.map((trip) => {
            return new Promise((res0) => {
              // Get the following for each trip
              const request_fp = trip.request_fp;
              const passengers_number = trip.passengers_number;
              const request_type = trip.request_type;
              const date_time = trip.date_requested;
              const wished_pickup_time = trip.wished_pickup_time;
              const isAccepted = trip.ride_state_vars.isAccepted;
              const isPickedUp = trip.ride_state_vars.inRideToDestination;
              const isDroppedPassenger =
                trip.ride_state_vars.isRideCompleted_riderSide;
              const isDroppedDriver =
                trip.ride_state_vars.isRideCompleted_driverSide;
              const isArrivedToDestination = trip.isArrivedToDestination;
              const connect_type = trip.connect_type;
              const payment_method = trip.payment_method;
              const amount = trip.fare;
              const destinations = trip.destinationData;
              const origin = trip.pickup_location_infos.suburb;
              //logger.info(trip.client_id)
              // Request for corresponding passenger
              query = {
                user_fingerprint: trip.client_id,
              };
              // Make Database request of corrresponding passenger

              collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user) => {
                  // request for the driver to get the taxi number
                  queryDriver = {
                    driver_fingerprint: trip.taxi_id,
                  };
                  collectionDrivers_profiles.findOne(queryDriver).then(
                    (driver) => {
                      const taxi_number = driver
                        ? driver.cars_data[0]["taxi_number"]
                        : "Pending...";

                      // initialize the trip details object
                      const tripDetails = {};
                      if (user[0]) {
                        const name = user[0]["name"];
                        const surname = user[0]["surname"];
                        const gender = user[0]["gender"];
                        const cellphone = user[0]["phone_number"];

                        //create the Object containing collected data
                        tripDetails.request_fp = request_fp;
                        tripDetails.passengers_number = passengers_number;
                        tripDetails.request_type = request_type;
                        tripDetails.date_time = date_time;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        tripDetails.connect_type = connect_type;
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "Pending...";
                        tripDetails.origin = origin;
                        // Add trip detail to final response
                        res0(tripDetails);
                      } else {
                        //! Set the passenger details to "not found" if fingerprint is
                        //!   unknown(suspecious case)
                        const name = "not found";
                        const surname = "not found";
                        const gender = "not found";
                        const cellphone = "not found";

                        tripDetails.request_fp = request_fp;
                        tripDetails.passengers_number = passengers_number;
                        tripDetails.request_type = request_type;
                        tripDetails.date_time = date_time;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        tripDetails.connect_type = connect_type;
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "Pending...";
                        tripDetails.origin = origin;
                        // Add trip detail to final response
                        res0(tripDetails);
                      }
                    },
                    (error) => {
                      logger.info(error);
                    }
                  );
                })
                .catch((error) => {
                  logger.info(error);
                });
            });
          });
          // Get all added objects from res0
          Promise.all(alltrips).then(
            (result) => {
              logger.info(
                `No cache found with error, ${result.length} rides found`
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
            }
          );
        })
        .catch((err) => logger.info(err));
    } else if (reply) {
      if (reply !== null) {
        // return found cash
        resolve(JSON.parse(reply));

        // !! Update cash in background
        new Promise((cashupdate) => {
          logger.info("Updating ride-overview...");
          collectionRidesDeliveryData
            .find({ ride_mode: "RIDE" })
            .sort({ date_requested: -1 })
            .limit(200)
            .toArray()
            .then((result) => {
              // Initialize the list of all trips
              //logger.info(result)
              let alltrips = result.map((trip) => {
                return new Promise((res0) => {
                  // Get the following for each trip
                  const request_fp = trip.request_fp;
                  const passengers_number = trip.passengers_number;
                  const request_type = trip.request_type;
                  const date_time = trip.date_requested;
                  const wished_pickup_time = trip.wished_pickup_time;
                  const isAccepted = trip.ride_state_vars.isAccepted;
                  const isPickedUp = trip.ride_state_vars.inRideToDestination;
                  const isDroppedPassenger =
                    trip.ride_state_vars.isRideCompleted_riderSide;
                  const isDroppedDriver =
                    trip.ride_state_vars.isRideCompleted_driverSide;
                  const isArrivedToDestination = trip.isArrivedToDestination;
                  const connect_type = trip.connect_type;
                  const payment_method = trip.payment_method;
                  const amount = trip.fare;
                  const destinations = trip.destinationData;
                  const origin = trip.pickup_location_infos.suburb;
                  //logger.info(trip.client_id)
                  // Request for corresponding passenger
                  query = {
                    user_fingerprint: trip.client_id,
                  };
                  // Make Database request of corrresponding passenger

                  collectionPassengers_profiles
                    .find(query)
                    .toArray()
                    .then((user) => {
                      // request for the driver to get the taxi number
                      queryDriver = {
                        driver_fingerprint: trip.taxi_id,
                      };
                      collectionDrivers_profiles.findOne(queryDriver).then(
                        (driver) => {
                          const taxi_number = driver
                            ? driver.cars_data[0]["taxi_number"]
                            : "Pending...";

                          // initialize the trip details object
                          const tripDetails = {};
                          if (user[0]) {
                            const name = user[0]["name"];
                            const surname = user[0]["surname"];
                            const gender = user[0]["gender"];
                            const cellphone = user[0]["phone_number"];

                            //create the Object containing collected data
                            tripDetails.request_fp = request_fp;
                            tripDetails.passengers_number = passengers_number;
                            tripDetails.request_type = request_type;
                            tripDetails.date_time = date_time;
                            tripDetails.isAccepted = isAccepted;
                            tripDetails.wished_pickup_time = wished_pickup_time;
                            tripDetails.isPickedUp = isPickedUp;
                            tripDetails.isDroppedPassenger = isDroppedPassenger;
                            tripDetails.isDroppedDriver = isDroppedDriver;
                            tripDetails.isArrivedToDestination =
                              isArrivedToDestination;
                            tripDetails.connect_type = connect_type;
                            tripDetails.payment_method = payment_method;
                            tripDetails.amount = amount;
                            tripDetails.destinations = destinations;
                            tripDetails.name = name;
                            tripDetails.surname = surname;
                            tripDetails.gender = gender;
                            tripDetails.cellphone = cellphone;
                            tripDetails.taxi_number = taxi_number
                              ? taxi_number
                              : "Pending...";
                            tripDetails.origin = origin;
                            // Add trip detail to final response
                            res0(tripDetails);
                          } else {
                            //! Set the passenger details to "not found" if fingerprint is
                            //!   unknown(suspecious case)
                            const name = "not found";
                            const surname = "not found";
                            const gender = "not found";
                            const cellphone = "not found";

                            tripDetails.request_fp = request_fp;
                            tripDetails.passengers_number = passengers_number;
                            tripDetails.request_type = request_type;
                            tripDetails.date_time = date_time;
                            tripDetails.isAccepted = isAccepted;
                            tripDetails.wished_pickup_time = wished_pickup_time;
                            tripDetails.isPickedUp = isPickedUp;
                            tripDetails.isDroppedPassenger = isDroppedPassenger;
                            tripDetails.isDroppedDriver = isDroppedDriver;
                            tripDetails.isArrivedToDestination =
                              isArrivedToDestination;
                            tripDetails.connect_type = connect_type;
                            tripDetails.payment_method = payment_method;
                            tripDetails.amount = amount;
                            tripDetails.destinations = destinations;
                            tripDetails.name = name;
                            tripDetails.surname = surname;
                            tripDetails.gender = gender;
                            tripDetails.cellphone = cellphone;
                            tripDetails.taxi_number = taxi_number
                              ? taxi_number
                              : "Pending...";
                            tripDetails.origin = origin;
                            // Add trip detail to final response
                            res0(tripDetails);
                          }
                        },
                        (error) => {
                          logger.info(error);
                        }
                      );
                    })
                    .catch((error) => {
                      logger.info(error);
                    });
                });
              });
              // Get all added objects from res0
              Promise.all(alltrips).then(
                (result) => {
                  logger.info(`${result.length} rides found`);
                  // Cash
                  redisCluster.setex(
                    "rideOverview-cache",
                    600000,
                    JSON.stringify(result),
                    redis.print
                  );
                  //!! No return : !resolve(result)
                  logger.info("update of ride-overview completed");
                },
                (error) => {
                  logger.info(error);
                }
              );
            })
            .catch((err) => logger.info(err));
        })
          .then((result) => {
            logger.info("cash returned");
          })
          .catch((error) => {
            logger.info(error);
          });
      } else {
        collectionRidesDeliveryData
          .find({ ride_mode: "RIDE" })
          .sort({ date_requested: -1 })
          .limit(200)
          .toArray()
          .then((result) => {
            // Initialize the list of all trips
            //logger.info(result)
            let alltrips = result.map((trip) => {
              return new Promise((res0) => {
                // Get the following for each trip
                const request_fp = trip.request_fp;
                const passengers_number = trip.passengers_number;
                const request_type = trip.request_type;
                const date_time = trip.date_requested;
                const wished_pickup_time = trip.wished_pickup_time;
                const isAccepted = trip.ride_state_vars.isAccepted;
                const isPickedUp = trip.ride_state_vars.inRideToDestination;
                const isDroppedPassenger =
                  trip.ride_state_vars.isRideCompleted_riderSide;
                const isDroppedDriver =
                  trip.ride_state_vars.isRideCompleted_driverSide;
                const isArrivedToDestination = trip.isArrivedToDestination;
                const connect_type = trip.connect_type;
                const payment_method = trip.payment_method;
                const amount = trip.fare;
                const destinations = trip.destinationData;
                const origin = trip.pickup_location_infos.suburb;
                //logger.info(trip.client_id)
                // Request for corresponding passenger
                query = {
                  user_fingerprint: trip.client_id,
                };
                // Make Database request of corrresponding passenger

                collectionPassengers_profiles
                  .find(query)
                  .toArray()
                  .then((user) => {
                    // request for the driver to get the taxi number
                    queryDriver = {
                      driver_fingerprint: trip.taxi_id,
                    };
                    collectionDrivers_profiles.findOne(queryDriver).then(
                      (driver) => {
                        const taxi_number = driver
                          ? driver.cars_data[0]["taxi_number"]
                          : "Pending...";

                        // initialize the trip details object
                        const tripDetails = {};
                        if (user[0]) {
                          const name = user[0]["name"];
                          const surname = user[0]["surname"];
                          const gender = user[0]["gender"];
                          const cellphone = user[0]["phone_number"];

                          //create the Object containing collected data
                          tripDetails.request_fp = request_fp;
                          tripDetails.passengers_number = passengers_number;
                          tripDetails.request_type = request_type;
                          tripDetails.date_time = date_time;
                          tripDetails.isAccepted = isAccepted;
                          tripDetails.wished_pickup_time = wished_pickup_time;
                          tripDetails.isPickedUp = isPickedUp;
                          tripDetails.isDroppedPassenger = isDroppedPassenger;
                          tripDetails.isDroppedDriver = isDroppedDriver;
                          tripDetails.isArrivedToDestination =
                            isArrivedToDestination;
                          tripDetails.connect_type = connect_type;
                          tripDetails.payment_method = payment_method;
                          tripDetails.amount = amount;
                          tripDetails.destinations = destinations;
                          tripDetails.name = name;
                          tripDetails.surname = surname;
                          tripDetails.gender = gender;
                          tripDetails.cellphone = cellphone;
                          tripDetails.taxi_number = taxi_number
                            ? taxi_number
                            : "Pending...";
                          tripDetails.origin = origin;
                          // Add trip detail to final response
                          res0(tripDetails);
                        } else {
                          //! Set the passenger details to "not found" if fingerprint is
                          //!   unknown(suspecious case)
                          const name = "not found";
                          const surname = "not found";
                          const gender = "not found";
                          const cellphone = "not found";

                          tripDetails.request_fp = request_fp;
                          tripDetails.passengers_number = passengers_number;
                          tripDetails.request_type = request_type;
                          tripDetails.date_time = date_time;
                          tripDetails.isAccepted = isAccepted;
                          tripDetails.wished_pickup_time = wished_pickup_time;
                          tripDetails.isPickedUp = isPickedUp;
                          tripDetails.isDroppedPassenger = isDroppedPassenger;
                          tripDetails.isDroppedDriver = isDroppedDriver;
                          tripDetails.isArrivedToDestination =
                            isArrivedToDestination;
                          tripDetails.connect_type = connect_type;
                          tripDetails.payment_method = payment_method;
                          tripDetails.amount = amount;
                          tripDetails.destinations = destinations;
                          tripDetails.name = name;
                          tripDetails.surname = surname;
                          tripDetails.gender = gender;
                          tripDetails.cellphone = cellphone;
                          tripDetails.taxi_number = taxi_number
                            ? taxi_number
                            : "Pending...";
                          tripDetails.origin = origin;
                          // Add trip detail to final response
                          res0(tripDetails);
                        }
                      },
                      (error) => {
                        logger.info(error);
                      }
                    );
                  })
                  .catch((error) => {
                    logger.info(error);
                  });
              });
            });
            // Get all added objects from res0
            Promise.all(alltrips).then(
              (result) => {
                logger.info(`${result.length} rides found`);
                redisCluster.setex(
                  "rideOverview-cache",
                  600000,
                  JSON.stringify(result),
                  redis.print
                );
                resolve(result);
              },
              (error) => {
                logger.info(error);
              }
            );
          })
          .catch((err) => logger.info(err));
      }
    } else {
      // Get directly from mongodb
      collectionRidesDeliveryData
        .find({ ride_mode: "RIDE" })
        .sort({ date_requested: -1 })
        .limit(200)
        .toArray()
        .then((result) => {
          // Initialize the list of all trips
          //logger.info(result)
          let alltrips = result.map((trip) => {
            return new Promise((res0) => {
              // Get the following for each trip
              const request_fp = trip.request_fp;
              const passengers_number = trip.passengers_number;
              const request_type = trip.request_type;
              const date_time = trip.date_requested;
              const wished_pickup_time = trip.wished_pickup_time;
              const isAccepted = trip.ride_state_vars.isAccepted;
              const isPickedUp = trip.ride_state_vars.inRideToDestination;
              const isDroppedPassenger =
                trip.ride_state_vars.isRideCompleted_riderSide;
              const isDroppedDriver =
                trip.ride_state_vars.isRideCompleted_driverSide;
              const isArrivedToDestination = trip.isArrivedToDestination;
              const connect_type = trip.connect_type;
              const payment_method = trip.payment_method;
              const amount = trip.fare;
              const destinations = trip.destinationData;
              const origin = trip.pickup_location_infos.suburb;
              //logger.info(trip.client_id)
              // Request for corresponding passenger
              query = {
                user_fingerprint: trip.client_id,
              };
              // Make Database request of corrresponding passenger

              collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user) => {
                  // request for the driver to get the taxi number
                  queryDriver = {
                    driver_fingerprint: trip.taxi_id,
                  };
                  collectionDrivers_profiles.findOne(queryDriver).then(
                    (driver) => {
                      const taxi_number = driver
                        ? driver.cars_data[0]["taxi_number"]
                        : "Pending...";

                      // initialize the trip details object
                      const tripDetails = {};
                      if (user[0]) {
                        const name = user[0]["name"];
                        const surname = user[0]["surname"];
                        const gender = user[0]["gender"];
                        const cellphone = user[0]["phone_number"];

                        //create the Object containing collected data
                        tripDetails.request_fp = request_fp;
                        tripDetails.passengers_number = passengers_number;
                        tripDetails.request_type = request_type;
                        tripDetails.date_time = date_time;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        tripDetails.connect_type = connect_type;
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "Pending...";
                        tripDetails.origin = origin;
                        // Add trip detail to final response
                        res0(tripDetails);
                      } else {
                        //! Set the passenger details to "not found" if fingerprint is
                        //!   unknown(suspecious case)
                        const name = "not found";
                        const surname = "not found";
                        const gender = "not found";
                        const cellphone = "not found";

                        tripDetails.request_fp = request_fp;
                        tripDetails.passengers_number = passengers_number;
                        tripDetails.request_type = request_type;
                        tripDetails.date_time = date_time;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        tripDetails.connect_type = connect_type;
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "Pending...";
                        tripDetails.origin = origin;
                        // Add trip detail to final response
                        res0(tripDetails);
                      }
                    },
                    (error) => {
                      logger.info(error);
                    }
                  );
                })
                .catch((error) => {
                  logger.info(error);
                });
            });
          });
          // Get all added objects from res0
          Promise.all(alltrips).then(
            (result) => {
              logger.info("No cache found...");
              logger.info(`${result.length} rides found`);
              redisCluster.setex(
                "rideOverview-cache",
                600000,
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
            }
          );
        })
        .catch((err) => logger.info(err));
    }
  });
}

function getDeliveryOverview(
  collectionRidesDeliveryData,
  collectionPassengers_profiles,
  collectionDrivers_profiles,
  resolve
) {
  // Getting data from redis cache or mongodb otherwise
  redisCluster.get("deliveryOverview-cache", (err, reply) => {
    logger.info("searching for delivery-overview cache...");
    logger.info("Found deliveries in cache: ", reply);

    // Get from database if error
    if (err) {
      collectionRidesDeliveryData
        .find({ ride_mode: "DELIVERY" })
        .toArray()
        .then((result) => {
          // Initialize the list of all trips
          //logger.info(result)
          let alltrips = result.map((trip) => {
            return new Promise((res0) => {
              // Get the following for each trip
              const delivery_id = trip.request_fp;
              const delivery_receiver =
                trip.delivery_infos.receiverName_delivery;
              const delivery_phone = trip.delivery_infos.receiverPhone_delivery;

              const request_type = trip.request_type;
              const isAccepted = trip.ride_state_vars.isAccepted;
              const date_time = trip.date_requested;
              const wished_pickup_time = trip.wished_pickup_time;
              const isPickedUp = trip.ride_state_vars.inRideToDestination;
              const isDroppedPassenger =
                trip.ride_state_vars.isRideCompleted_riderSide;
              const isDroppedDriver =
                trip.ride_state_vars.isRideCompleted_driverSide;
              const isArrivedToDestination = trip.isArrivedToDestination;
              const payment_method = trip.payment_method;
              const amount = trip.fare;
              const destinations = trip.destinationData;

              const origin = trip.pickup_location_infos.location_name;
              //logger.info(trip.client_id)
              // Request for corresponding passenger
              query = {
                user_fingerprint: trip.client_id,
              };
              // Make Database request of corrresponding passenger

              collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user) => {
                  // Request for the driver's info
                  queryDriver = {
                    driver_fingerprint: trip.taxi_id,
                  };
                  collectionDrivers_profiles
                    .findOne(queryDriver)
                    .then((driver) => {
                      const taxi_number = driver
                        ? driver.cars_data[0]["taxi_number"]
                        : "unknown";

                      // initialize the trip details object
                      const tripDetails = {};
                      if (user[0]) {
                        const name = user[0]["name"];
                        const surname = user[0]["surname"];
                        const gender = user[0]["gender"];
                        const cellphone = user[0]["phone_number"];

                        //create the Object containing collected data
                        tripDetails.delivery_id = delivery_id;
                        tripDetails.delivery_receiver = delivery_receiver;
                        tripDetails.delivery_phone = delivery_phone;

                        tripDetails.request_type = request_type;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.date_time = date_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.origin = origin;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "unknown";
                        // Add trip detail to final response
                        res0(tripDetails);
                      } else {
                        //! Set the sender details to "not found" if fingerprint is
                        //!   unknown(suspecious case)
                        const name = "not found";
                        const surname = "not found";
                        const gender = "not found";
                        const cellphone = "not found";

                        tripDetails.delivery_id = delivery_id;
                        tripDetails.delivery_receiver = delivery_receiver;
                        tripDetails.delivery_phone = delivery_phone;

                        //tripDetails.passengers_number = passengers_number
                        tripDetails.request_type = request_type;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.date_time = date_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.origin = origin;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "unknown";
                        // Add trip detail to final response
                        res0(tripDetails);
                      }
                    })
                    .catch((error) => {
                      logger.info(error);
                    });
                })
                .catch((error) => {
                  logger.info(error);
                });
            });
          });
          // Get all added objects from res0
          Promise.all(alltrips).then(
            (result) => {
              //! Cache result:
              redisCluster.set(
                "deliveryOverview-cache",
                JSON.stringify(result),
                redis.print
              );
              logger.info(`${result.length}Deliveries found`);
              resolve(result);
            },
            (error) => {
              logger.info(error);
            }
          );
        })
        .catch((err) => logger.info(err));
    } else if (reply) {
      if (reply !== null) {
        // return the cached data
        resolve(JSON.parse(reply));

        //!!Update cache in background (no resolve() included)
        new Promise((cashUpdate) => {
          collectionRidesDeliveryData
            .find({ ride_mode: "DELIVERY" })
            .toArray()
            .then((result) => {
              // Initialize the list of all trips
              //logger.info(result)
              let alltrips = result.map((trip) => {
                return new Promise((res0) => {
                  // Get the following for each trip
                  const delivery_id = trip.request_fp;
                  const delivery_receiver =
                    trip.delivery_infos.receiverName_delivery;
                  const delivery_phone =
                    trip.delivery_infos.receiverPhone_delivery;

                  const request_type = trip.request_type;
                  const isAccepted = trip.ride_state_vars.isAccepted;
                  const date_time = trip.date_requested;
                  const wished_pickup_time = trip.wished_pickup_time;
                  const isPickedUp = trip.ride_state_vars.inRideToDestination;
                  const isDroppedPassenger =
                    trip.ride_state_vars.isRideCompleted_riderSide;
                  const isDroppedDriver =
                    trip.ride_state_vars.isRideCompleted_driverSide;
                  const isArrivedToDestination = trip.isArrivedToDestination;
                  const payment_method = trip.payment_method;
                  const amount = trip.fare;
                  const destinations = trip.destinationData;

                  const origin = trip.pickup_location_infos.location_name;
                  //logger.info(trip.client_id)
                  // Request for corresponding passenger
                  query = {
                    user_fingerprint: trip.client_id,
                  };
                  // Make Database request of corrresponding passenger

                  collectionPassengers_profiles
                    .find(query)
                    .toArray()
                    .then((user) => {
                      // Request for the driver's info
                      queryDriver = {
                        driver_fingerprint: trip.taxi_id,
                      };
                      collectionDrivers_profiles
                        .findOne(queryDriver)
                        .then((driver) => {
                          const taxi_number = driver
                            ? driver.cars_data[0]["taxi_number"]
                            : "unknown";

                          // initialize the trip details object
                          const tripDetails = {};
                          if (user[0]) {
                            const name = user[0]["name"];
                            const surname = user[0]["surname"];
                            const gender = user[0]["gender"];
                            const cellphone = user[0]["phone_number"];

                            //create the Object containing collected data

                            tripDetails.delivery_id = delivery_id;
                            tripDetails.delivery_receiver = delivery_receiver;
                            tripDetails.delivery_phone = delivery_phone;

                            tripDetails.request_type = request_type;
                            tripDetails.isAccepted = isAccepted;
                            tripDetails.wished_pickup_time = wished_pickup_time;
                            tripDetails.date_time = date_time;
                            tripDetails.isPickedUp = isPickedUp;
                            tripDetails.isDroppedPassenger = isDroppedPassenger;
                            tripDetails.isDroppedDriver = isDroppedDriver;
                            tripDetails.isArrivedToDestination =
                              isArrivedToDestination;
                            //tripDetails.connect_type = connect_type
                            tripDetails.payment_method = payment_method;
                            tripDetails.amount = amount;
                            tripDetails.destinations = destinations;
                            tripDetails.name = name;
                            tripDetails.surname = surname;
                            tripDetails.gender = gender;
                            tripDetails.cellphone = cellphone;
                            tripDetails.origin = origin;
                            tripDetails.taxi_number = taxi_number
                              ? taxi_number
                              : "unknown";
                            // Add trip detail to final response
                            res0(tripDetails);
                          } else {
                            //! Set the sender details to "not found" if fingerprint is
                            //!   unknown(suspecious case)
                            const name = "not found";
                            const surname = "not found";
                            const gender = "not found";
                            const cellphone = "not found";

                            tripDetails.delivery_id = delivery_id;
                            tripDetails.delivery_receiver = delivery_receiver;
                            tripDetails.delivery_phone = delivery_phone;

                            //tripDetails.passengers_number = passengers_number
                            tripDetails.request_type = request_type;
                            tripDetails.isAccepted = isAccepted;
                            tripDetails.wished_pickup_time = wished_pickup_time;
                            tripDetails.date_time = date_time;
                            tripDetails.isPickedUp = isPickedUp;
                            tripDetails.isDroppedPassenger = isDroppedPassenger;
                            tripDetails.isDroppedDriver = isDroppedDriver;
                            tripDetails.isArrivedToDestination =
                              isArrivedToDestination;
                            //tripDetails.connect_type = connect_type
                            tripDetails.payment_method = payment_method;
                            tripDetails.amount = amount;
                            tripDetails.destinations = destinations;
                            tripDetails.name = name;
                            tripDetails.surname = surname;
                            tripDetails.gender = gender;
                            tripDetails.cellphone = cellphone;
                            tripDetails.origin = origin;
                            tripDetails.taxi_number = taxi_number
                              ? taxi_number
                              : "unknown";
                            // Add trip detail to final response
                            res0(tripDetails);
                          }
                        })
                        .catch((error) => {
                          logger.info(error);
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                    });
                });
              });
              // Get all added objects from res0
              Promise.all(alltrips).then(
                (result) => {
                  logger.info(`${result.length}Deliveries found`);
                  //!! DO NOT RETURN : !resolve(result), rather cache updated value
                  redisCluster.set(
                    "deliveryOverview-cache",
                    JSON.stringify(result)
                  );
                  logger.info("delivery-overview updated in background...");
                },
                (error) => {
                  logger.info(error);
                }
              );
            })
            .catch((err) => logger.info(err));
        })
          .then((cache) => {
            logger.info("caching delivery-overview completed");
          })
          .catch((error) => {
            logger.info(error);
            resolve({ error: "something went wrong while updating cache" });
          });
      } else {
        collectionRidesDeliveryData
          .find({ ride_mode: "DELIVERY" })
          .toArray()
          .then((result) => {
            // Initialize the list of all trips
            //logger.info(result)
            let alltrips = result.map((trip) => {
              return new Promise((res0) => {
                // Get the following for each trip
                const delivery_id = trip.request_fp;
                const delivery_receiver =
                  trip.delivery_infos.receiverName_delivery;
                const delivery_phone =
                  trip.delivery_infos.receiverPhone_delivery;

                const request_type = trip.request_type;
                const isAccepted = trip.ride_state_vars.isAccepted;
                const date_time = trip.date_requested;
                const wished_pickup_time = trip.wished_pickup_time;
                const isPickedUp = trip.ride_state_vars.inRideToDestination;
                const isDroppedPassenger =
                  trip.ride_state_vars.isRideCompleted_riderSide;
                const isDroppedDriver =
                  trip.ride_state_vars.isRideCompleted_driverSide;
                const isArrivedToDestination = trip.isArrivedToDestination;
                const payment_method = trip.payment_method;
                const amount = trip.fare;
                const destinations = trip.destinationData;

                const origin = trip.pickup_location_infos.location_name;
                //logger.info(trip.client_id)
                // Request for corresponding passenger
                query = {
                  user_fingerprint: trip.client_id,
                };
                // Make Database request of corrresponding passenger

                collectionPassengers_profiles
                  .find(query)
                  .toArray()
                  .then((user) => {
                    // Request for the driver's info
                    queryDriver = {
                      driver_fingerprint: trip.taxi_id,
                    };
                    collectionDrivers_profiles
                      .findOne(queryDriver)
                      .then((driver) => {
                        const taxi_number = driver
                          ? driver.cars_data[0]["taxi_number"]
                          : "unknown";

                        // initialize the trip details object
                        const tripDetails = {};
                        if (user[0]) {
                          const name = user[0]["name"];
                          const surname = user[0]["surname"];
                          const gender = user[0]["gender"];
                          const cellphone = user[0]["phone_number"];

                          //create the Object containing collected data

                          tripDetails.delivery_id = delivery_id;
                          tripDetails.delivery_receiver = delivery_receiver;
                          tripDetails.delivery_phone = delivery_phone;

                          tripDetails.request_type = request_type;
                          tripDetails.isAccepted = isAccepted;
                          tripDetails.wished_pickup_time = wished_pickup_time;
                          tripDetails.date_time = date_time;
                          tripDetails.isPickedUp = isPickedUp;
                          tripDetails.isDroppedPassenger = isDroppedPassenger;
                          tripDetails.isDroppedDriver = isDroppedDriver;
                          tripDetails.isArrivedToDestination =
                            isArrivedToDestination;
                          //tripDetails.connect_type = connect_type
                          tripDetails.payment_method = payment_method;
                          tripDetails.amount = amount;
                          tripDetails.destinations = destinations;
                          tripDetails.name = name;
                          tripDetails.surname = surname;
                          tripDetails.gender = gender;
                          tripDetails.cellphone = cellphone;
                          tripDetails.origin = origin;
                          tripDetails.taxi_number = taxi_number
                            ? taxi_number
                            : "unknown";
                          // Add trip detail to final response
                          res0(tripDetails);
                        } else {
                          //! Set the sender details to "not found" if fingerprint is
                          //!   unknown(suspecious case)
                          const name = "not found";
                          const surname = "not found";
                          const gender = "not found";
                          const cellphone = "not found";

                          tripDetails.delivery_id = delivery_id;
                          tripDetails.delivery_receiver = delivery_receiver;
                          tripDetails.delivery_phone = delivery_phone;

                          //tripDetails.passengers_number = passengers_number
                          tripDetails.request_type = request_type;
                          tripDetails.isAccepted = isAccepted;
                          tripDetails.wished_pickup_time = wished_pickup_time;
                          tripDetails.date_time = date_time;
                          tripDetails.isPickedUp = isPickedUp;
                          tripDetails.isDroppedPassenger = isDroppedPassenger;
                          tripDetails.isDroppedDriver = isDroppedDriver;
                          tripDetails.isArrivedToDestination =
                            isArrivedToDestination;
                          //tripDetails.connect_type = connect_type
                          tripDetails.payment_method = payment_method;
                          tripDetails.amount = amount;
                          tripDetails.destinations = destinations;
                          tripDetails.name = name;
                          tripDetails.surname = surname;
                          tripDetails.gender = gender;
                          tripDetails.cellphone = cellphone;
                          tripDetails.origin = origin;
                          tripDetails.taxi_number = taxi_number
                            ? taxi_number
                            : "unknown";
                          // Add trip detail to final response
                          res0(tripDetails);
                        }
                      })
                      .catch((error) => {
                        logger.info(error);
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                  });
              });
            });
            // Get all added objects from res0
            Promise.all(alltrips).then(
              (result) => {
                redisCluster.set(
                  "deliveryOverview-cache",
                  JSON.stringify(result)
                );
                logger.info(`${result.length}Deliveries found`);
                resolve(result);
              },
              (error) => {
                logger.info(error);
              }
            );
          })
          .catch((err) => logger.info(err));
      }
    } else {
      collectionRidesDeliveryData
        .find({ ride_mode: "DELIVERY" })
        .toArray()
        .then((result) => {
          // Initialize the list of all trips
          //logger.info(result)
          let alltrips = result.map((trip) => {
            return new Promise((res0) => {
              // Get the following for each trip
              const delivery_id = trip.request_fp;
              const delivery_receiver =
                trip.delivery_infos.receiverName_delivery;
              const delivery_phone = trip.delivery_infos.receiverPhone_delivery;

              const request_type = trip.request_type;
              const isAccepted = trip.ride_state_vars.isAccepted;
              const date_time = trip.date_requested;
              const wished_pickup_time = trip.wished_pickup_time;
              const isPickedUp = trip.ride_state_vars.inRideToDestination;
              const isDroppedPassenger =
                trip.ride_state_vars.isRideCompleted_riderSide;
              const isDroppedDriver =
                trip.ride_state_vars.isRideCompleted_driverSide;
              const isArrivedToDestination = trip.isArrivedToDestination;
              const payment_method = trip.payment_method;
              const amount = trip.fare;
              const destinations = trip.destinationData;

              const origin = trip.pickup_location_infos.location_name;
              //logger.info(trip.client_id)
              // Request for corresponding passenger
              query = {
                user_fingerprint: trip.client_id,
              };
              // Make Database request of corrresponding passenger

              collectionPassengers_profiles
                .find(query)
                .toArray()
                .then((user) => {
                  // Request for the driver's info
                  queryDriver = {
                    driver_fingerprint: trip.taxi_id,
                  };
                  collectionDrivers_profiles
                    .findOne(queryDriver)
                    .then((driver) => {
                      const taxi_number = driver
                        ? driver.cars_data[0]["taxi_number"]
                        : "unknown";

                      // initialize the trip details object
                      const tripDetails = {};
                      if (user[0]) {
                        const name = user[0]["name"];
                        const surname = user[0]["surname"];
                        const gender = user[0]["gender"];
                        const cellphone = user[0]["phone_number"];

                        //create the Object containing collected data

                        tripDetails.delivery_id = delivery_id;
                        tripDetails.delivery_receiver = delivery_receiver;
                        tripDetails.delivery_phone = delivery_phone;

                        tripDetails.request_type = request_type;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.date_time = date_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.origin = origin;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "unknown";
                        // Add trip detail to final response
                        res0(tripDetails);
                      } else {
                        //! Set the sender details to "not found" if fingerprint is
                        //!   unknown(suspecious case)
                        const name = "not found";
                        const surname = "not found";
                        const gender = "not found";
                        const cellphone = "not found";

                        tripDetails.delivery_id = delivery_id;
                        tripDetails.delivery_receiver = delivery_receiver;
                        tripDetails.delivery_phone = delivery_phone;

                        //tripDetails.passengers_number = passengers_number
                        tripDetails.request_type = request_type;
                        tripDetails.isAccepted = isAccepted;
                        tripDetails.wished_pickup_time = wished_pickup_time;
                        tripDetails.date_time = date_time;
                        tripDetails.isPickedUp = isPickedUp;
                        tripDetails.isDroppedPassenger = isDroppedPassenger;
                        tripDetails.isDroppedDriver = isDroppedDriver;
                        tripDetails.isArrivedToDestination =
                          isArrivedToDestination;
                        //tripDetails.connect_type = connect_type
                        tripDetails.payment_method = payment_method;
                        tripDetails.amount = amount;
                        tripDetails.destinations = destinations;
                        tripDetails.name = name;
                        tripDetails.surname = surname;
                        tripDetails.gender = gender;
                        tripDetails.cellphone = cellphone;
                        tripDetails.origin = origin;
                        tripDetails.taxi_number = taxi_number
                          ? taxi_number
                          : "unknown";
                        // Add trip detail to final response
                        res0(tripDetails);
                      }
                    })
                    .catch((error) => {
                      logger.info(error);
                    });
                })
                .catch((error) => {
                  logger.info(error);
                });
            });
          });
          // Get all added objects from res0
          Promise.all(alltrips).then(
            (result) => {
              redisCluster.set(
                "deliveryOverview-cache",
                JSON.stringify(result),
                redis.print
              );
              logger.info(`${result.length}Deliveries found`);
              resolve(result);
            },
            (error) => {
              logger.info(error);
            }
          );
        })
        .catch((err) => logger.info(err));
    }
  });
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
  let total = [];
  let totalToday = [];
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);

  driversList.map((driver) => {
    total.push(Number(driver["totalmoney"]));
    totalToday.push(Number(driver["totalMoneyToday"]));
  });

  let totalMoney = {
    total: Sum(total),
    totalToday: Sum(totalToday),
  };

  resolve(totalMoney);
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

  resolve(CashWalletObject);

  //return CashWalletObject
}
/**
 * @function getDeliveryProviderInfo: Gets the basic info provided to the delivery provider dashboard
 * @param {collection} DriversCollection
 * @param {collection} FilteringCollection: The rides/deliveries collection
 * @param {string} deliveryProviderName : The name of the delivery provider as
 *                                          As registered at delivery_provider param
 *
 */

function getDeliveryProviderInfo(
  DriversCollection,
  FilteringCollection,
  deliveryProviderName,
  resolve
) {
  DriversCollection.find(
    (query = {
      operation_clearances: "Delivery",
      delivery_provider: deliveryProviderName,
    })
  )
    .sort({ date_requested: -1 })
    .toArray()
    .then((individualsList) => {
      let drivers = individualsList.map((individual) => {
        return new Promise((outcome) => {
          // Get the following:
          const name = individual.name;
          const surname = individual.surname;
          const phone_number = individual.phone_number;
          const taxi_number = individual.cars_data[0].taxi_number;
          const plate_number = individual.cars_data[0].plate_number;
          const car_brand = individual.cars_data[0].car_brand;
          const status = individual.operational_state.status;

          //Query for this individual's completed rides
          query = {
            taxi_id: individual.driver_fingerprint,
            isArrivedToDestination: true,
          };

          FilteringCollection.find(query)
            .toArray()
            .then((result) => {
              const totaltrip = result.length;

              //Make computation to get corresponding total money made
              new Promise((res) => {
                GetCashWallet(result, res);
              })
                .then((futuremoney) => {
                  const totalmoney = futuremoney.totalCashWallet;

                  // Get today's data:
                  let startOfToday = new Date();
                  startOfToday.setHours(0, 0, 0, 0);

                  FilteringCollection.find({
                    taxi_id: individual.driver_fingerprint,
                    isArrivedToDestination: true,
                    date_requested: { $gte: startOfToday.addHours(2) }, //!! Resolved date +2
                  })
                    .toArray()
                    .then((todaydata) => {
                      const todaytrip = todaydata.length;

                      new Promise((res) => {
                        GetCashWallet(todaydata, res);
                      })
                        .then((todaymoney) => {
                          const todayTotalMoney = todaymoney.totalCashWallet;

                          // Initialize Individual data
                          let Individual_driver = {};

                          // Append data to the Individual driver Object:
                          Individual_driver.name = name;
                          Individual_driver.surname = surname;
                          Individual_driver.phone_number = phone_number;
                          Individual_driver.taxi_number = taxi_number;
                          Individual_driver.plate_number = plate_number;
                          Individual_driver.car_brand = car_brand;
                          Individual_driver.status = status;
                          Individual_driver.totaltrip = totaltrip;
                          Individual_driver.totalmoney = totalmoney;
                          Individual_driver.todaytrip = todaytrip;
                          Individual_driver.totalMoneyToday = todayTotalMoney;

                          outcome(Individual_driver);
                        })
                        .catch((error) => {
                          logger.info(error);
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                    });
                })
                .catch((error) => {
                  logger.info(error);
                });
            })
            .catch((error) => {
              logger.info(error);
            });
        });
      });
      Promise.all(drivers).then(
        (result) => {
          // Get total money made by drivers:
          new Promise((res) => {
            OverallmoneyPartner(result, res);
          })
            .then((future) => {
              let driverAll = {
                drivers_list: result,
                drivers_count: result.length,
                total_money: future.total,
                total_money_today: future.totalToday,
              };
              resolve(driverAll);
            })
            .catch((error) => {
              logger.info(error);
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            });
        },
        (error) => {
          logger.info(error);
          resolve({ response: "error", flag: "Invalid_params_maybe" });
        }
      );
    })
    .catch((error) => {
      logger.info(error);
      resolve({ response: "error", flag: "Invalid_params_maybe" });
    });
}

/**
 * @function getOwners : Gets the individual information of owners (delivery providers)
 * @param {collection} ownersCollection
 * @param {return} resolve:
 */

function getOwners(ownersCollection, resolve) {
  ownersCollection
    .find({})
    .toArray()
    .then((owners) => {
      let ownersData = owners.map((owner) => {
        return new Promise((outcome) => {
          const name = owner.name;
          const email = owner.email;
          const password = owner.password;

          const ownerData = {
            name: name,
            email: email,
            password: password,
          };
          //return owner's data
          outcome(ownerData);
        });
      });
      Promise.all(ownersData).then(
        (result) => {
          resolve(result);
        },
        (error) => {
          logger.info(error);
          resolve({ response: "error", flag: "Wrong parameters maybe" });
        }
      );
    });
}
/**
 * @function userExists : Authenticates the delivery provider
 * @param {string} email
 * @param {string} password
 * @param {array} providers
 */
function userExists(provider, email, password, providers, resolve) {
  resolve(
    providers.some(function (el) {
      return (
        el.email === email && el.password === password && el.name === provider
      );
    })
  );
}
/*
* Testing the function 
logger.info(userExists("deliveryGuy", "delivery@guy","12345678",[
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

//! Start of Functions dealing with internal admin-users

function getAdminUsers(adminUsersCollection, resolve) {
  adminUsersCollection
    .find({})
    .toArray()
    .then((users) => {
      let usersData = users.map((user) => {
        return new Promise((outcome) => {
          const name = user.username;
          const email = user.email;
          const password = user.password;

          const userData = {
            name: name,
            email: email,
            password: password,
          };
          //return owner's data
          outcome(userData);
        });
      });
      Promise.all(usersData).then(
        (result) => {
          resolve(result);
        },
        (error) => {
          logger.info(error);
          resolve({ error: "error", flag: "Wrong parameters maybe" });
        }
      );
    });
}
/**
 * @function userAdminExists : Authenticates the admin user
 * @param {string} username : username of the admin user
 * @param {string} email
 * @param {string} password
 * @param {array} adminUsersList
 */
function userAdminExists(username, email, password, adminUsersList, resolve) {
  resolve(
    adminUsersList.some(function (el) {
      return (
        el.email === email && el.password === password && el.name === username
      );
    })
  );
}
//! End of Functions dealing with internal admin-users

//!-------------------------------------------------------------
//! Start of Functions dealing with ride state
//!-------------------------------------------------------------

/**
 * @function updateEntry: Updates a document's entries of a given collection
 * @param {collection} collection: The collection to be affected
 * @param {object} query : Used to identify the document to be updated
 * @param {object} newValues: New values to be updated
 * @param {*} resolve
 */
function updateEntry(collection, query, newValues, resolve) {
  collection
    .updateOne(query, newValues)
    .then((result) => {
      logger.info(result.result.nModified);
      if (result.result.nModified != 0) {
        resolve({ success: "one document updated" });
      } else {
        logger.info(result);
        resolve({ error: "The document was not updated" });
      }
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "The document was not updated" });
    });
}

/**
 *
 * @param {collection} collectionDestination: The name of the collection the document will be moved to
 * @param {collection} collectionOrigin: The name of the collection from which the document has to be deleted
 * @param {object} query
 * @param {return} resolve: return
 */

function CancellTrip(collectionDestination, collectionOrigin, query, resolve) {
  //Find the document to be deleted
  collectionOrigin
    .findOne(query)
    .then((data) => {
      logger.info(data.request_fp);
      //create global event
      let eventObject = {};
      // Move it to global events
      collectionDestination
        .insertOne(data)
        .then((result) => {
          // If successfully inserted, proceed to delete the document from the origin
          if (result.result.n === 1) {
            logger.info("New cancelled trip inserted");
            // Deleting the object
            collectionOrigin
              .deleteOne(query)
              .then((outcome) => {
                logger.info(outcome.result);

                if (outcome.result.n === 1) {
                  // If successful deletion of document
                  logger.info("successful deletion of trip");
                  resolve({ success: true, error: false });
                } else if (outcome.result.n === 0) {
                  // If no document was deleted
                  logger.info(
                    "the ride could not be deleted, maybe no longer exist"
                  );
                  resolve({ success: false, error: false });
                }
              })
              .catch((error) => {
                logger.info(error);
                resolve({ success: false, error: true });
              });
          } else {
            logger.info("Failed to insert the object");
            resolve({ success: false, error: true });
          }
        })
        .catch((error) => {
          logger.info(
            "An error occured, could not insert the object into cancelled rides, maybe duplicate found"
          );
          logger.info(error);
          resolve({ success: false, error: true });
        });
    })
    .catch((error) => {
      logger.info("An error occured, could not find the object");
      logger.info(error);
      resolve({ success: false, error: true });
    });
}

function todayRideDeliveryInProgress(collectionRidesDeliveryData, resolve) {
  collectionRidesDeliveryData
    .find({
      ride_mode: "RIDE",
      isArrivedToDestination: false,
      date_requested: {
        $gte: new Date(windhoekDateTime.setHours(0, 0, 0, 0)).addHours(2),
      },
    })
    .toArray()
    .then((ridesProgress) => {
      collectionRidesDeliveryData
        .find({
          ride_mode: "DELIVERY",
          isArrivedToDestination: false,
          date_requested: {
            $gte: new Date(windhoekDateTime.setHours(0, 0, 0, 0)).addHours(2),
          },
        })
        .toArray()
        .then((deliveryProgress) => {
          resolve({
            ride_in_progress_count_today: ridesProgress.length,
            delivery_in_progress_count_today: deliveryProgress.length,
          });
        })
        .catch((error) => {
          logger.info(error);
          resolve({ error: "Failed to get deliveries in progress" });
        });
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to get rides in progress" });
    });
}

/**
 * @func generateUniqueFingerprint()
 * Generate unique fingerprint for any string size.
 */
function generateUniqueFingerprint(str, encryption = false, resolve) {
  str = str.trim();
  let fingerprint = null;
  if (encryption === false) {
    fingerprint = crypto
      .createHmac(
        "sha512WithRSAEncryption",
        "TAXICONNECTBASICKEYFINGERPRINTS-RIDES-DELIVERY-ACCOUNTS"
      )
      .update(str)
      .digest("hex");
    resolve(fingerprint);
  } else if (/md5/i.test(encryption)) {
    fingerprint = crypto
      .createHmac(
        "md5WithRSAEncryption",
        "TAXICONNECTBASICKEYFINGERPRINTS-RIDES-DELIVERY-ACCOUNTS"
      )
      .update(str)
      .digest("hex");
    resolve(fingerprint);
  } //Other - default - for creating accounts.
  else {
    fingerprint = crypto
      .createHmac(
        "sha256",
        "TAXICONNECTBASICKEYFINGERPRINTS-RIDES-DELIVERY-ACCOUNTS"
      )
      .update(str)
      .digest("hex");
    resolve(fingerprint);
  }
}

/**
 * @func authOrLoginAdmins
 * responsible for validating and logging in all the admins users
 * @param adminInputedData: the email, password or just pin
 * @param resolve
 */
function authOrLoginAdmins(adminInputedData, resolve) {
  // new Promise((resHash) => {
  //   generateUniqueFingerprint("12345678", "sha256", resHash);
  // }).then((result) => logger.warn(result));
  //? Deduct the logging step based on the provided data
  if (
    adminInputedData.email !== undefined &&
    adminInputedData.email !== null &&
    adminInputedData.password !== undefined &&
    adminInputedData.password !== null
  ) {
    //Step 1 - email/password verification and pin sending
    //Get the hashed password
    adminInputedData.password = adminInputedData.password.trim();

    new Promise((resHash) => {
      generateUniqueFingerprint(adminInputedData.password, "sha256", resHash);
    })
      .then((result) => {
        adminInputedData.password = result;

        let idSearchObject = {
          corporate_email: adminInputedData.email,
          password: adminInputedData.password,
        };

        collectionAdminUsers
          .find(idSearchObject)
          .toArray(function (err, adminData) {
            if (err) {
              logger.error(err);
              resolve("failed_auth");
            }

            if (
              adminData !== undefined &&
              adminData !== null &&
              adminData.length > 0
            ) {
              adminData = adminData[0];
              //Found
              //Send the security pin as well
              new Promise((resSendPin) => {
                let otp = otpGenerator.generate(6, {
                  upperCase: false,
                  specialChars: false,
                  alphabets: false,
                });

                otp = otp.length < 6 ? otp * 10 : otp;
                //?1. Send pin to corporate email

                //?2. Save pin to the account
                collectionAdminUsers.updateOne(
                  {
                    admin_fp: adminData.admin_fp,
                  },
                  {
                    $set: {
                      "security_details.security_pin": parseInt(otp),
                      "security_details.date_created": new Date(chaineDateUTC),
                    },
                  },
                  function (err, reslt) {
                    if (err) {
                      logger.error(err);
                      resSendPin(false);
                    }
                    //...
                    resSendPin(true);
                  }
                );
              })
                .then()
                .catch();
              //? -------------------------------------
              let finalResponse =
                adminData.isSuspended === undefined ||
                adminData.isSuspended === null ||
                adminData.isSuspended !== false
                  ? { status: "suspended" }
                  : {
                      status: "authenticated_user_step_1",
                      admin_fp: adminData.admin_fp,
                    };
              resolve(finalResponse);
            } //Unknown admin
            else {
              logger.warn(adminData);
              resolve("unknown_admin");
            }
          });
      })
      .catch((error) => {
        logger.error(error);
        resolve("failed_auth");
      });
  } //Step 2 - pin checking
  else {
    if (
      adminInputedData.admin_fp !== undefined &&
      adminInputedData.admin_fp !== null &&
      adminInputedData.pin !== undefined &&
      adminInputedData.pin !== null
    ) {
      //Valid data detected
      let idSearchObject = {
        admin_fp: adminInputedData.admin_fp,
        "security_details.security_pin": parseInt(adminInputedData.pin),
      };

      collectionAdminUsers
        .find(idSearchObject)
        .toArray(function (err, adminData) {
          if (err) {
            logger.error(err);
            resolve("failed_auth");
          }

          if (
            adminData !== undefined &&
            adminData !== null &&
            adminData.length > 0
          ) {
            adminData = adminData[0];

            //Valid admin
            let finalResponse =
              adminData.isSuspended === undefined ||
              adminData.isSuspended === null ||
              adminData.isSuspended !== false
                ? { status: "suspended" }
                : {
                    status: "authenticated_user_step_2",
                    admin_fp: adminData.admin_fp,
                    name: adminData.name,
                    surname: adminData.surname,
                    isSuspended: adminData.isSuspended,
                    access_patterns: adminData.access_patterns,
                  };
            resolve(finalResponse);
          }
          //Unknown admin
          else {
            logger.warn(adminData);
            resolve("unknown_admin");
          }
        });
    } //Invalid data detected
    else {
      logger.warn("Invalid data");
      resolve("failed_auth");
    }
  }
}

var collectionPassengers_profiles = null;
var collectionDrivers_profiles = null;
var collectionRidesDeliveryData = null;
var collectionRidesDeliveryDataCancelled = null;
var collectionOwners = null;
var collectionAdminUsers = null;

// All APIs :
MongoClient.connect(
  process.env.URL_MONGODB,
  /production/i.test(process.env.EVIRONMENT)
    ? {
        tlsCAFile: certFile, //The DocDB cert
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }
    : {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
  function (err, clientMongo) {
    if (err) {
      logger.info(err);
    }
    logger.info("Connected to MongoDB");

    const dbMongo = clientMongo.db("Taxiconnect");
    collectionPassengers_profiles = dbMongo.collection("passengers_profiles");
    collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
    collectionRidesDeliveryData = dbMongo.collection(
      "rides_deliveries_requests"
    );
    collectionRidesDeliveryDataCancelled = dbMongo.collection(
      "cancelled_rides_deliveries_requests"
    );
    collectionOwners = dbMongo.collection("owners_profiles");
    collectionAdminUsers = dbMongo.collection("administration_central");
    //? INITIALIZE EXPRESS ONCE
    app
      .get("/", (req, res) => {
        //!DO NOT SEND AN ANSWER FROM THE ROOT PATH
        logger.info("All is good at main view server");
      })
      .use(express.json())
      .use(express.urlencoded({ extended: true }));

    app.get("/test", (req, res) => {
      res.status(200).json({
        hasSucceeded: true,
        message: "main view server up and running!",
      });
    });

    /**
     * ALL THE APIs ROUTES FOR THIS SERVICE.
     * ! Comment the top of each API
     */

    /**
     * 1. API responsible for getting all the general statistics.
     * @param: some params that this API is expecting...
     */
    app.get("/statistics", (req, res) => {
      logger.info("Statistics API called!");
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
          //logger.info(result);
          res.send(result);
        },
        (error) => {
          logger.info(error);
          res.send({ response: "error", flag: "Invalid_params_maybe" });
        }
      );
    });

    /**
     * 2. API responsible for getting rides
     * !except cancelled rides
     */
    app.get("/ride-overview", (req, res) => {
      logger.info("Ride overview API called!!");
      new Promise((res) => {
        getRideOverview(
          collectionRidesDeliveryData,
          collectionPassengers_profiles,
          collectionDrivers_profiles,
          res
        );
      }).then(
        (result) => {
          logger.info(result);
          res.send(result);
        },
        (error) => {
          logger.info(error);
          res.send({
            response: "error",
            flag: "Something went wrong, could be Invalid parameters",
          });
        }
      );
    });

    app.get("/inprogress-ride-delivery-count-today", (req, res) => {
      new Promise((res) => {
        todayRideDeliveryInProgress(collectionRidesDeliveryData, res);
      })
        .then((data) => {
          if (data.error) {
            logger.info(data);
            res.send({
              error: "Failed to get rides and deliveries in progress",
            });
          }
          logger.info(data);
          res.send(data);
        })
        .catch((error) => {
          logger.info(error);
          res.send({
            error: "Failed to get rides and deliveries in progress @API level",
          });
        });
    });
    /**
     * API that sets a given ride as completed and pickup "confirmed" by passenger
     * Input is the id of the ride request_fp (commes as "id" )
     */
    app.post("/set-ride-confirmed", (req, res) => {
      logger.info(" SET RIDE CONFIRMED API CALLED");
      logger.info(
        "----- Updating Ride State (Setting complete) ..... IN PROGRESS.......-----------"
      );
      // Convert the received id of the ride to an ObjectID to be identified @MongoDB _id
      //let query = {_id: new ObjectID(req.body.id.toString()) }
      /*let query = { request_fp: req.body.request_fp }
    let newValues = {$set: {"ride_state_vars.isRideCompleted_riderSide" :true, 
                             isArrivedToDestination: true,
                             "ride_state_vars.isRideCompleted_driverSide": true}} */
      logger.info(`request fingerprint: ${req.body.request_fp}`);
      new Promise((res) => {
        //Call updating function
        updateEntry(
          collectionRidesDeliveryData,
          { request_fp: req.body.request_fp },
          {
            $set: {
              "ride_state_vars.isRideCompleted_riderSide": true,
              isArrivedToDestination: true,
              "ride_state_vars.isRideCompleted_driverSide": true,
            },
          },
          res
        );
      })
        .then((result) => {
          logger.info(result);
          if (result.success) {
            res.status(200).send({ success: "Successful update" });
          } else if (result.error) {
            res.send({
              error:
                " Something went wrong while updating the entry, ride already confirmed",
            });
          }
        })
        .catch((error) => {
          logger.info(error);
          res.send({ error: " Something went wrong while updating the entry" });
        });
    });

    /**
     * API responsible of cancelling trips
     */

    app.post("/cancell-trip", (req, res) => {
      logger.info("TRIP CANCELLATION API CALLED...");

      new Promise((res) => {
        CancellTrip(
          collectionRidesDeliveryDataCancelled,
          collectionRidesDeliveryData,
          { request_fp: req.body.request_fp },
          res
        );
      })
        .then((outcome) => {
          logger.info(outcome);
          if (outcome.success) {
            logger.info("SUCCESSFUL CANCELLATION");
            // Send back successful response object
            res.send({ success: true, error: false });
          } else if (outcome.error) {
            logger.info("FAILED TO CANCELL RIDE");
            // send back error response object
            res.send({ success: false, error: true });
          }
        })
        .catch((error) => {
          logger.info(error);
          res.send({ success: false, error: true });
        });
    });

    /**
     * API responsible of getting all deliveries data
     */
    app.get("/delivery-overview", (req, res) => {
      logger.info("Delivery overview API called delivery!!");

      new Promise((res) => {
        getDeliveryOverview(
          collectionRidesDeliveryData,
          collectionPassengers_profiles,
          collectionDrivers_profiles,
          res
        );
      }).then(
        (result) => {
          logger.info(result);
          res.send(result);
        },
        (error) => {
          logger.info(error);
          res.status(500).send({
            response: "error",
            flag: "Something went wrong, could be Invalid parameters",
          });
        }
      );
    });
    /**
     * API to authenticate an owner
     */
    app.post("/authenticate-owner", (req, res) => {
      let response = res;

      new Promise((res) => {
        getOwners(collectionOwners, res);
      })
        .then((ownersList) => {
          new Promise((res) => {
            userExists(
              req.body.name,
              req.body.email,
              req.body.password,
              ownersList,
              res
            );
          }).then(
            (result) => {
              let authentication_response = result;
              response.send({ authenticated: authentication_response });
            },
            (error) => {
              logger.info(error);
              response
                .status(500)
                .send({ message: "error", flag: "Maybe Invalid parameters" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
          response.status(500).send({
            message: "error",
            flag: "Maybe Invalid parameters of owners",
          });
        });
    });

    /**
     * API responsible of getting the partners data (delivery providers)
     */

    app.get("/delivery-provider-data/:provider", (req, res) => {
      let response = res;
      // Get the received parameter
      let providerName = req.params.provider;

      logger.info(`Delivery provider API called by: ${providerName}`);

      new Promise((res) => {
        getDeliveryProviderInfo(
          collectionDrivers_profiles,
          collectionRidesDeliveryData,
          req.params.provider,
          res
        );
      })
        .then((result) => {
          let deliveryInfo = result;

          response.send(deliveryInfo);
          logger.info(result);
        })
        .catch((error) => {
          logger.info(error);
          response.send({
            response: "error",
            flag: "Something went wrong, could be Invalid parameters",
          });
        });
    });

    /**
     * Responsible for authenticating and eventually login in the admins
     */
    app.post("/authAndEventualLogin_admins", (req, res) => {
      new Promise((resCompute) => {
        let inputDataInitial = req.body;
        authOrLoginAdmins(inputDataInitial, resCompute);
      })
        .then((result) => {
          res.send({ response: result });
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "failed_auth" });
        });
    });

    /**
     * responsible for getting the latest access patterns and suspension infos for the admins.
     */
    app.get("/getLastesAccessAndSuspensionIfoProcessor", (req, res) => {
      new Promise((resCompute) => {
        resolveDate();
        let params = urlParser.parse(req.url, true);
        req = params.query;

        if (req.admin_fp !== undefined && req.admin_fp !== null) {
          //? Check if the admin exists
          collectionAdminUsers
            .find({ admin_fp: req.admin_fp })
            .toArray(function (err, adminData) {
              if (err) {
                logger.error(err);
                resolve("failed_auth");
              }
              //...
              if (
                adminData !== undefined &&
                adminData !== null &&
                adminData.length > 0
              ) {
                adminData = adminData[0];
                //Valid admin
                let finalResponse =
                  adminData.isSuspended === undefined ||
                  adminData.isSuspended === null ||
                  adminData.isSuspended !== false
                    ? { status: "suspended" }
                    : {
                        status: "active",
                        admin_fp: adminData.admin_fp,
                        name: adminData.name,
                        surname: adminData.surname,
                        isSuspended: adminData.isSuspended,
                        access_patterns: adminData.access_patterns,
                      };
                resCompute(finalResponse);
              } //invalid admin
              else {
                resCompute("failed_auth");
              }
            });
          //Good
        } //Invalid data
        else {
          resCompute("failed_auth");
        }
      })
        .then((result) => {
          res.send({ response: result });
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "failed_auth" });
        });
    });
  }
);

server.listen(process.env.STATS_ROOT, () => {
  logger.info(
    `Main view server up and running at port ${process.env.STATS_ROOT}`
  );
});
