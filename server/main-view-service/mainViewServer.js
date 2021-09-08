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
const { promisify, inspect } = require("util");
var compression = require("compression");

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

const redisGet = promisify(redisCluster.get).bind(redisCluster);

let transporter = nodemailer.createTransport({
  host: process.env.INOUT_GOING_SERVER,
  port: process.env.LOGIN_EMAIL_SMTP,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.LOGIN_EMAIL_USER, // generated ethereal user
    pass: process.env.LOGIN_EMAIL_PASSWORD, // generated ethereal password
  },
});

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
                new Promise((resPinSend) => {
                  // send mail with defined transport object
                  let info = transporter.sendMail({
                    from: process.env.LOGIN_EMAIL_USER, // sender address
                    to: adminData.corporate_email, // list of receivers
                    subject: "Security Pin", // Subject line
                    //text: `Hi ${adminData.name}, here is your security Pin: ${otp}`, // plain text body
                    html: `
                    <!doctype html>
                    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                      <head>
                        <title>
                          
                        </title>
                        <!--[if !mso]><!-- -->
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <!--<![endif]-->
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style type="text/css">
                          #outlook a { padding:0; }
                          body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
                          table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
                          img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
                          p { display:block;margin:13px 0; }
                        </style>
                        <!--[if mso]>
                        <xml>
                        <o:OfficeDocumentSettings>
                          <o:AllowPNG/>
                          <o:PixelsPerInch>96</o:PixelsPerInch>
                        </o:OfficeDocumentSettings>
                        </xml>
                        <![endif]-->
                        <!--[if lte mso 11]>
                        <style type="text/css">
                          .outlook-group-fix { width:100% !important; }
                        </style>
                        <![endif]-->
                        
                      <!--[if !mso]><!-->
                        <link href="https://fonts.googleapis.com/css?family=Ubuntu:400,700" rel="stylesheet" type="text/css">
                <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
                        <style type="text/css">
                          @import url(https://fonts.googleapis.com/css?family=Ubuntu:400,700);
                @import url(https://fonts.googleapis.com/css?family=Cabin:400,700);
                        </style>
                      <!--<![endif]-->

                    
                        
                    <style type="text/css">
                      @media only screen and (max-width:480px) {
                        .mj-column-per-100 { width:100% !important; max-width: 100%; }
                      }
                    </style>
                    
                  
                        <style type="text/css">
                        
                        

                    @media only screen and (max-width:480px) {
                      table.full-width-mobile { width: 100% !important; }
                      td.full-width-mobile { width: auto !important; }
                    }
                  
                        </style>
                        <style type="text/css">.hide_on_mobile { display: none !important;} 
                        @media only screen and (min-width: 480px) { .hide_on_mobile { display: block !important;} }
                        .hide_section_on_mobile { display: none !important;} 
                        @media only screen and (min-width: 480px) { 
                            .hide_section_on_mobile { 
                                display: table !important;
                            } 

                            div.hide_section_on_mobile { 
                                display: block !important;
                            }
                        }
                        .hide_on_desktop { display: block !important;} 
                        @media only screen and (min-width: 480px) { .hide_on_desktop { display: none !important;} }
                        .hide_section_on_desktop { 
                            display: table !important;
                            width: 100%;
                        } 
                        @media only screen and (min-width: 480px) { .hide_section_on_desktop { display: none !important;} }
                        
                          p, h1, h2, h3 {
                              margin: 0px;
                          }

                          a {
                              text-decoration: none;
                              color: inherit;
                          }

                          @media only screen and (max-width:480px) {

                            .mj-column-per-100 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-100 > .mj-column-per-75 { width:75%!important; max-width:75%!important; }
                            .mj-column-per-100 > .mj-column-per-60 { width:60%!important; max-width:60%!important; }
                            .mj-column-per-100 > .mj-column-per-50 { width:50%!important; max-width:50%!important; }
                            .mj-column-per-100 > .mj-column-per-40 { width:40%!important; max-width:40%!important; }
                            .mj-column-per-100 > .mj-column-per-33 { width:33.333333%!important; max-width:33.333333%!important; }
                            .mj-column-per-100 > .mj-column-per-25 { width:25%!important; max-width:25%!important; }

                            .mj-column-per-100 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-75 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-60 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-50 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-40 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-33 { width:100%!important; max-width:100%!important; }
                            .mj-column-per-25 { width:100%!important; max-width:100%!important; }
                        }</style>
                        
                      </head>
                      <body style="background-color:#FFFFFF;">
                        
                        
                      <div style="background-color:#FFFFFF;">
                        
                      
                      <!--[if mso | IE]>
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td align="left" style="font-size:0px;padding:0px 0px 0px 0px;word-break:break-word;">
                                
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                        <tbody>
                          <tr>
                            <td style="width:84px;">
                              
                      <img height="auto" src="https://storage.googleapis.com/topolio27767/plugin-assets/6320/27767/logo_2.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="84">
                    
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td style="font-size:0px;padding:10px 10px;padding-top:10px;padding-right:10px;word-break:break-word;">
                                
                      <p style="font-family: Ubuntu, Helvetica, Arial; border-top: solid 1px #d0d0d0; font-size: 1; margin: 0px auto; width: 100%;">
                      </p>
                      
                      <!--[if mso | IE]>
                        <table
                          align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px #d0d0d0;font-size:1;margin:0px auto;width:580px;" role="presentation" width="580px"
                        >
                          <tr>
                            <td style="height:0;line-height:0;">
                              &nbsp;
                            </td>
                          </tr>
                        </table>
                      <![endif]-->
                    
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td align="left" style="font-size:0px;padding:15px 15px 15px 15px;word-break:break-word;">
                                
                      <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:11px;line-height:1.5;text-align:left;color:#000000;"><p style="font-family: Ubuntu, Helvetica, Arial;"><span style="font-family: Ubuntu, sans-serif; font-size: 16px;">Hi ${adminData.name}, this is a security email containing the security Pin needed to complete your temporary end-to-end login to Oscar.</span></p></div>
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td align="center" vertical-align="middle" style="font-size:0px;padding:20px 20px 20px 20px;word-break:break-word;">
                                
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                        <tr>
                          <td align="center" bgcolor="#0e8491" role="presentation" style="border:none;border-radius:24px;cursor:auto;mso-padding-alt:9px 26px 9px 26px;background:#0e8491;" valign="middle">
                            <p style="display: inline-block; background: #0e8491; color: #ffffff; font-family: Ubuntu, Helvetica, Arial, sans-serif, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: normal; line-height: 100%; margin: 0; text-decoration: none; text-transform: none; padding: 9px 26px 9px 26px; mso-padding-alt: 0px; border-radius: 24px;">
                              <span style="font-family: Helvetica, sans-serif;">${otp}</span>
                            </p>
                          </td>
                        </tr>
                      </table>
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td style="font-size:0px;word-break:break-word;">
                                
                      
                    <!--[if mso | IE]>
                    
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="50" style="vertical-align:top;height:50px;">
                      
                    <![endif]-->
                  
                      <div style="height:50px;">
                        &nbsp;
                      </div>
                      
                    <!--[if mso | IE]>
                    
                        </td></tr></table>
                      
                    <![endif]-->
                  
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td style="font-size:0px;padding:10px 10px;padding-top:10px;padding-right:10px;word-break:break-word;">
                                
                      <p style="font-family: Ubuntu, Helvetica, Arial; border-top: solid 1px #d0d0d0; font-size: 1; margin: 0px auto; width: 100%;">
                      </p>
                      
                      <!--[if mso | IE]>
                        <table
                          align="center" border="0" cellpadding="0" cellspacing="0" style="border-top:solid 1px #d0d0d0;font-size:1;margin:0px auto;width:580px;" role="presentation" width="580px"
                        >
                          <tr>
                            <td style="height:0;line-height:0;">
                              &nbsp;
                            </td>
                          </tr>
                        </table>
                      <![endif]-->
                    
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td align="left" style="font-size:0px;padding:15px 15px 15px 15px;word-break:break-word;">
                                
                      <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:11px;line-height:1.5;text-align:left;color:#000000;"><p style="font-family: Ubuntu, Helvetica, Arial; text-align: center;"><span style="font-size: 14px; font-family: Ubuntu, sans-serif;">If you did not request for it, please let us know at support@taxiconnectna.com</span></p></div>
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                        align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                    
                      
                      <div style="margin:0px auto;max-width:600px;">
                        
                        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                          <tbody>
                            <tr>
                              <td style="direction:ltr;font-size:0px;padding:9px 0px 9px 0px;text-align:center;">
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                              class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                            
                      <div class="mj-column-per-100 outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                        
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                        
                            <tr>
                              <td align="left" style="font-size:0px;padding:15px 15px 15px 15px;word-break:break-word;">
                                
                      <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:11px;line-height:1.5;text-align:left;color:#000000;"><p style="font-family: Ubuntu, Helvetica, Arial; text-align: center;">TaxiConnect &copy; 2020. All rights reserved.</p></div>
                    
                              </td>
                            </tr>
                          
                      </table>
                    
                      </div>
                    
                          <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                      </div>
                    
                      
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      <![endif]-->
                    
                    
                      </div>
                    
                      </body>
                    </html>
                  
                    `, // html body
                  });

                  console.log("Message sent: %s", info.messageId);
                  resPinSend(true);
                })
                  .then()
                  .catch();

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

/**
 * @func getWeekNumber
 * Responsible for getting the week number for any specific date.
 * @param d: the date object
 */
function getWeekNumber(d) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  // Return array of year and week number
  return [d.getUTCFullYear(), weekNo];
}

/**
 * @func getAdminSummaryData
 * Responsible for getting the admin global summary data very efficiently.
 * @param params: will contain the day_zoom which specifies how far behind in days to start to
 * @param resolve
 */
function getAdminSummaryData(params, resolve) {
  //! Default day zoom to 3 days in the past if not set
  params["day_zoom"] =
    params.day_zoom === undefined ||
    params === undefined ||
    params.day_zoom === null ||
    params === null
      ? 3
      : params.day_zoom;

  let redisKey = `admininstrationSummaryData-${params.day_zoom}`; //Cache based on the day zoom

  redisGet(redisKey)
    .then((resp) => {
      if (resp !== null) {
        //Found some cached data
        try {
          //Rehydrate
          new Promise((resCompute) => {
            execGetAdminSummaryData(params, redisKey, resCompute);
          })
            .then()
            .catch((error) => {
              logger.error(error);
            });
          //...
          resp = JSON.parse(resp);
          resolve(resp);
        } catch (error) {
          logger.error(error);
          new Promise((resCompute) => {
            execGetAdminSummaryData(params, redisKey, resCompute);
          })
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve("error_getting_stats");
            });
        }
      } //Make a fresh search
      else {
        new Promise((resCompute) => {
          execGetAdminSummaryData(params, redisKey, resCompute);
        })
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            logger.error(error);
            resolve("error_getting_stats");
          });
      }
    })
    .catch((error) => {
      logger.error(error);
      //Make a fresh search
      new Promise((resCompute) => {
        execGetAdminSummaryData(params, redisKey, resCompute);
      })
        .then((result) => {
          resolve(result);
        })
        .catch((error) => {
          logger.error(error);
          resolve("error_getting_stats");
        });
    });
}
/**
 * @func execGetAdminSummaryData
 * Responsible for actively getting the admin summary data
 * @param params: will contain the day_zoom which specifies how far behind in days to start to
 * @param redisKey: the redis key to cache the results to
 * @param resolve
 */
function execGetAdminSummaryData(params, redisKey, resolve) {
  resolveDate();
  let daysBehindToLook = params.day_zoom * 24 * 3600 * 1000;
  let startingDate = new Date(
    new Date(chaineDateUTC).getTime() - daysBehindToLook
  );

  //? Array fixed base suburbs
  let arrayFixedBaseSuburbs = {
    Academia: "Academia",
    Auasblick: "Auasblik",
    Auasblik: "Auasblik",
    Avis: "Avis",
    "Big Bend": "Big Bend",
    Brakwater: "Brakwater",
    Cimbebasia: "Cimbebasia",
    "Dorado Park": "Dorado Park",
    Eros: "Eros",
    "Eros Park": "Eros Park",
    Goreangab: "Goreangab",
    "Greenwell Matongo": "Greenwell Matongo",
    Hakahana: "Hakahana",
    Havana: "Havana",
    "Hochland Park": "Hochland Park",
    Hochlandpark: "Hochland Park",
    "Informal settlements": "Informal settlements",
    Katutura: "Katutura",
    Khomasdal: "Khomasdal",
    "Kilimanjaro Informal Settlement": "Kilimanjaro Informal Settlement",
    "Klein Windhoek": "Klein Windhoek",
    "Lafrenz Industrial": "Lafrenz Industrial",
    Ludwigsdorf: "Ludwigsdorf",
    "Luxury Hill": "Luxury Hill",
    "Northern Industrial": "Northern Industrial",
    Okuryangava: "Okuryangava",
    Olympia: "Olympia",
    Otjomuise: "Otjomuise",
    "Pioneers Park": "Pioneers Park",
    Pionierspark: "Pioneers Park",
    "Prosperita Industrial": "Prosperita Industrial",
    Prosperita: "Prosperita Industrial",
    "Rocky Crest": "Rocky Crest",
    Wanaheda: "Wanaheda",
    "Samora Machel Constituency": "Wanaheda",
    "Southern Industrial Area": "Southern Industrial Area",
    Suiderhof: "Suiderhof",
    "Tauben Glen": "Tauben Glen",
    "Windhoek Central / CBD": "Windhoek Central / CBD",
    "Windhoek Central": "Windhoek Central / CBD",
    "Windhoek North": "Windhoek North",
    "Windhoek West": "Windhoek West",
  };

  //? The model of the meta object final response.
  let modelMetaDataResponse = {
    genericGlobalStats: {
      total_trips: 0, //? Done
      total_successful_trips: 0, //?Done
      total_cancelled_trips: 0, //?Done
      total_connectme_trips: 0, //?Done
      total_connectus_trips: 0, //?Done
      total_scheduled_trips: 0, //?Done
      total_immediate_trips: 0, //? Done
      total_cash_trips: 0, //?Done
      total_wallet_trips: 0, //?done
      //...
      total_cash_trips_sales: 0, //?Done
      total_wallet_trips_sales: 0, //?done
      //...rides
      total_successful_rides: 0, //?done
      total_cancelled_rides: 0, //?Done
      total_successful_immediate_rides: 0, //?Done
      total_successful_scheduled_rides: 0, //?Done
      total_cancelled_immediate_rides: 0, //?Done
      total_cancelled_scheduled_rides: 0, //?Done
      total_successful_connectme_rides: 0, //?Done
      total_cancelled_connectme_rides: 0, //?Done
      total_successful_connectus_rides: 0, //?Done
      total_cancelled_connectus_rides: 0, //?Done
      total_successful_cash_rides: 0, //?Done
      total_cancelled_cash_rides: 0, //?Done
      total_successful_wallet_rides: 0, //?Done
      total_cancelled_wallet_rides: 0, //?Done
      //.
      total_successful_cash_rides_sales: 0, //?Done
      total_cancelled_cash_rides_sales: 0, //?Done
      total_successful_wallet_rides_sales: 0, //?Done
      total_cancelled_wallet_rides_sales: 0, //?Done
      //...deliveries
      total_successful_deliveries: 0, //?Done
      total_cancelled_deliveries: 0, //?Done
      total_successful_immediate_deliveries: 0, //?Done
      total_successful_scheduled_deliveries: 0, //?Done
      total_cancelled_immediate_deliveries: 0, //?Done
      total_cancelled_scheduled_deliveries: 0, //?Done
      total_successful_cash_deliveries: 0, //?Done
      total_cancelled_cash_deliveries: 0, //?Done
      total_successful_wallet_deliveries: 0, //?Done
      total_cancelled_wallet_deliveries: 0, //?Done
      //.
      total_successful_cash_deliveries_sales: 0, //?Done
      total_cancelled_cash_deliveries_sales: 0, //?Done
      total_successful_wallet_deliveries_sales: 0, //?Done
      total_cancelled_wallet_deliveries_sales: 0, //?Done
      //...Number of passengers
      total_numberOf_passengers_requestedFor: 0,
      total_numberOf_passengers_successfully_moved: 0,
      total_numberOf_passengers_cancelled_moved: 0,
      //...Handling
      percentage_trip_handling: 0, //success/total * 100%
      percentage_rides_handling: 0,
      percentage_deliveries_handling: 0,
      //...drivers/riders
      total_riders: 0,
      total_drivers: 0,
      riders_to_drivers_ratio: 0,
      //...Commission
      total_commission: 0, //Generated by rides during zoom period
      total_commission_collected: 0,
      total_commission_pending: 0,
    },
    daily_view: {}, //Daily summary of the selected day zoom
    weekly_view: {}, //weekly summary of the selected day zoom
    monthly_view: {}, //monthly summary of the selected day zoom
    yearly_view: {}, //yearly summary of the selected day zoom
    drivers_view: {}, //drivers summary of the selected day zoom
    riders_view: {}, //riders summary of the selected day zoom
    //...Traffic per suburbs
    busiest_pickup_suburbs: {},
    busiest_destination_suburbs: {},
  };

  //Get the global numbers
  //? 1. Trips related trips
  new Promise((resGetTripsInfos) => {
    collectionRidesDeliveryData
      .find({
        date_requested: { $gte: new Date(startingDate.toISOString()) },
      })
      .toArray(function (err, tripData) {
        if (err) {
          resGetTripsInfos("error_getting_trips");
        }
        //...
        if (
          tripData !== undefined &&
          tripData !== null &&
          tripData.length > 0
        ) {
          modelMetaDataResponse.genericGlobalStats.total_trips =
            tripData.length;
          modelMetaDataResponse.genericGlobalStats.total_successful_trips =
            tripData.length;
          //...
          tripData.map((trip) => {
            //Get the passengers numbers
            modelMetaDataResponse.genericGlobalStats.total_numberOf_passengers_requestedFor +=
              parseInt(trip.passengers_number);
            modelMetaDataResponse.genericGlobalStats.total_numberOf_passengers_successfully_moved +=
              parseInt(trip.passengers_number);

            //? 1. Get the daily_view stats - successful rides
            let day_date_argument = new Date(trip.date_requested)
              .toLocaleString()
              .split(", ")[0];

            modelMetaDataResponse.daily_view = getInsightStats(
              trip,
              day_date_argument,
              modelMetaDataResponse.daily_view,
              "successful"
            );

            //? 2. Get the weekly_view stats - successful rides
            //Week number - year
            let week_number_argument = `${
              getWeekNumber(new Date(trip.date_requested))[1]
            }-${getWeekNumber(new Date(trip.date_requested))[0]}`;

            modelMetaDataResponse.weekly_view = getInsightStats(
              trip,
              week_number_argument,
              modelMetaDataResponse.weekly_view,
              "successful"
            );

            //? 3. Get the monthly_view stats - successful rides
            //Month number - year
            let month_number_argument = `${
              new Date(trip.date_requested).getMonth() + 1
            }-${new Date(trip.date_requested).getFullYear()}`;

            modelMetaDataResponse.monthly_view = getInsightStats(
              trip,
              month_number_argument,
              modelMetaDataResponse.monthly_view,
              "successful"
            );

            //? 4. Get the yearly_view stats - successful rides
            //Year number
            let year_number_argument = new Date(
              trip.date_requested
            ).getFullYear();

            modelMetaDataResponse.yearly_view = getInsightStats(
              trip,
              year_number_argument,
              modelMetaDataResponse.yearly_view,
              "successful"
            );

            //? 5. Get the drivers_view stats - successful rides
            //driver_fp
            if (
              trip.taxi_id !== null &&
              trip.taxi_id !== undefined &&
              trip.taxi_id !== false &&
              trip.taxi_id !== "false"
            ) {
              let driver_number_argument = trip.taxi_id;

              modelMetaDataResponse.drivers_view = getInsightStats(
                trip,
                driver_number_argument,
                modelMetaDataResponse.drivers_view,
                "successful"
              );
            }

            //? 6. Get the riders_view stats - successful rides
            //user_fp
            let rider_number_argument = trip.client_id;

            modelMetaDataResponse.riders_view = getInsightStats(
              trip,
              rider_number_argument,
              modelMetaDataResponse.riders_view,
              "successful"
            );

            //? 7. Get the busiest_pickup_suburbs stats - successful rides
            //user_fp
            let pickup_number_argument =
              arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb] !==
                undefined &&
              arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb] !== null
                ? arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb] !==
                    undefined &&
                  arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb]
                : trip.pickup_location_infos.suburb;

            modelMetaDataResponse.busiest_pickup_suburbs = getInsightStats(
              trip,
              pickup_number_argument,
              modelMetaDataResponse.busiest_pickup_suburbs,
              "successful"
            );

            //? 8. Get the busiest_destination_suburbs stats - successful rides
            trip.destinationData.map((destination) => {
              //user_fp
              let destination_number_argument =
                arrayFixedBaseSuburbs[destination.suburb] !== undefined &&
                arrayFixedBaseSuburbs[destination.suburb] !== null
                  ? arrayFixedBaseSuburbs[destination.suburb]
                  : destination.suburb;

              modelMetaDataResponse.busiest_destination_suburbs =
                getInsightStats(
                  trip,
                  destination_number_argument,
                  modelMetaDataResponse.busiest_destination_suburbs,
                  "successful"
                );
            });
            //! ---------------------------------------------------------------------------------------------
            if (/RIDE/i.test(trip.ride_mode)) {
              //Ride
              modelMetaDataResponse.genericGlobalStats.total_successful_rides += 1;
            } else if (/DELIVERY/i.test(trip.ride_mode)) {
              //Delivery
              modelMetaDataResponse.genericGlobalStats.total_successful_deliveries += 1;
            }
            //...
            if (/connectme/i.test(trip.connect_type)) {
              //Connectme
              modelMetaDataResponse.genericGlobalStats.total_connectme_trips += 1;
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_connectme_rides += 1;
              }
            } //ConnectUs
            else {
              modelMetaDataResponse.genericGlobalStats.total_connectus_trips += 1;
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_connectus_rides += 1;
              }
            }
            //...Schedule
            if (/scheduled/i.test(trip.request_type)) {
              //Scheduled rides
              modelMetaDataResponse.genericGlobalStats.total_scheduled_trips += 1;
              //.
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_scheduled_rides += 1;
              } else if (/DELIVERY/i.test(trip.ride_mode)) {
                //Delivery
                modelMetaDataResponse.genericGlobalStats.total_successful_scheduled_deliveries += 1;
              }
            } //Immediate
            else {
              modelMetaDataResponse.genericGlobalStats.total_immediate_trips += 1;
              //.
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_immediate_rides += 1;
              } else if (/DELIVERY/i.test(trip.ride_mode)) {
                //Delivery
                modelMetaDataResponse.genericGlobalStats.total_successful_immediate_deliveries += 1;
              }
            }
            //...Payment method
            if (/cash/i.test(trip.payment_method)) {
              //Cash
              modelMetaDataResponse.genericGlobalStats.total_cash_trips += 1;
              modelMetaDataResponse.genericGlobalStats.total_cash_trips_sales +=
                parseFloat(trip.fare);
              //.
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_cash_rides += 1;
                modelMetaDataResponse.genericGlobalStats.total_successful_cash_rides_sales +=
                  parseFloat(trip.fare);
              } else if (/DELIVERY/i.test(trip.ride_mode)) {
                //Delivery
                modelMetaDataResponse.genericGlobalStats.total_successful_cash_deliveries += 1;
                modelMetaDataResponse.genericGlobalStats.total_successful_cash_deliveries_sales +=
                  parseFloat(trip.fare);
              }
            } //Wallet
            else {
              modelMetaDataResponse.genericGlobalStats.total_wallet_trips += 1;
              modelMetaDataResponse.genericGlobalStats.total_wallet_trips_sales +=
                parseFloat(trip.fare);
              //.
              if (/RIDE/i.test(trip.ride_mode)) {
                //Ride
                modelMetaDataResponse.genericGlobalStats.total_successful_wallet_rides += 1;
                modelMetaDataResponse.genericGlobalStats.total_successful_wallet_rides_sales +=
                  parseFloat(trip.fare);
              } else if (/DELIVERY/i.test(trip.ride_mode)) {
                //Delivery
                modelMetaDataResponse.genericGlobalStats.total_successful_wallet_deliveries += 1;
                modelMetaDataResponse.genericGlobalStats.total_successful_wallet_deliveries_sales +=
                  parseFloat(trip.fare);
              }
            }
          });
          //Done for successful rides/deliveries
          resGetTripsInfos(true);
        } //No trip Data
        else {
          resGetTripsInfos("empty_trip_data");
        }
      });
  })
    .then((resultTrips) => {
      //?2. Get the cancelled rides/deliveries
      new Promise((resGetTripsInfos) => {
        collectionRidesDeliveryDataCancelled
          .find({
            date_deleted: { $gte: new Date(startingDate.toISOString()) },
          })
          .toArray(function (err, tripData) {
            if (err) {
              resGetTripsInfos("error_getting_trips");
            }
            //...
            if (
              tripData !== undefined &&
              tripData !== null &&
              tripData.length > 0
            ) {
              modelMetaDataResponse.genericGlobalStats.total_trips +=
                tripData.length;
              modelMetaDataResponse.genericGlobalStats.total_cancelled_trips =
                tripData.length;
              //...
              tripData.map((trip) => {
                //Get the passengers numbers
                modelMetaDataResponse.genericGlobalStats.total_numberOf_passengers_requestedFor +=
                  parseInt(trip.passengers_number);
                modelMetaDataResponse.genericGlobalStats.total_numberOf_passengers_cancelled_moved +=
                  parseInt(trip.passengers_number);

                //? 1. Get the daily_view stats - cancelled rides
                let day_date_argument = new Date(trip.date_requested)
                  .toLocaleString()
                  .split(", ")[0];

                modelMetaDataResponse.daily_view = getInsightStats(
                  trip,
                  day_date_argument,
                  modelMetaDataResponse.daily_view,
                  "cancelled"
                );

                //? 2. Get the weekly_view stats - cancelled rides
                //Week number - year
                let week_number_argument = `${
                  getWeekNumber(new Date(trip.date_requested))[1]
                }-${getWeekNumber(new Date(trip.date_requested))[0]}`;

                modelMetaDataResponse.weekly_view = getInsightStats(
                  trip,
                  week_number_argument,
                  modelMetaDataResponse.weekly_view,
                  "cancelled"
                );

                //? 3. Get the monthly_view stats - cancelled rides
                //Month number - year
                let month_number_argument = `${
                  new Date(trip.date_requested).getMonth() + 1
                }-${new Date(trip.date_requested).getFullYear()}`;

                modelMetaDataResponse.monthly_view = getInsightStats(
                  trip,
                  month_number_argument,
                  modelMetaDataResponse.monthly_view,
                  "cancelled"
                );

                //? 4. Get the yearly_view stats - cancelled rides
                //Year number
                let year_number_argument = new Date(
                  trip.date_requested
                ).getFullYear();

                modelMetaDataResponse.yearly_view = getInsightStats(
                  trip,
                  year_number_argument,
                  modelMetaDataResponse.yearly_view,
                  "cancelled"
                );

                //? 5. Get the drivers_view stats - cancelled rides
                //driver_fp
                if (
                  trip.taxi_id !== null &&
                  trip.taxi_id !== undefined &&
                  trip.taxi_id !== false &&
                  trip.taxi_id !== "false"
                ) {
                  let driver_number_argument = trip.taxi_id;

                  modelMetaDataResponse.drivers_view = getInsightStats(
                    trip,
                    driver_number_argument,
                    modelMetaDataResponse.drivers_view,
                    "cancelled"
                  );
                }

                //? 6. Get the riders_view stats - cancelled rides
                //user_fp
                let rider_number_argument = trip.client_id;

                modelMetaDataResponse.riders_view = getInsightStats(
                  trip,
                  rider_number_argument,
                  modelMetaDataResponse.riders_view,
                  "cancelled"
                );

                //? 7. Get the busiest_pickup_suburbs stats - successful rides
                //user_fp
                let pickup_number_argument =
                  arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb] !==
                    undefined &&
                  arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb] !==
                    null
                    ? arrayFixedBaseSuburbs[
                        trip.pickup_location_infos.suburb
                      ] !== undefined &&
                      arrayFixedBaseSuburbs[trip.pickup_location_infos.suburb]
                    : trip.pickup_location_infos.suburb;

                modelMetaDataResponse.busiest_pickup_suburbs = getInsightStats(
                  trip,
                  pickup_number_argument,
                  modelMetaDataResponse.busiest_pickup_suburbs,
                  "cancelled"
                );

                //? 8. Get the busiest_destination_suburbs stats - successful rides
                trip.destinationData.map((destination) => {
                  //user_fp
                  let destination_number_argument =
                    arrayFixedBaseSuburbs[destination.suburb] !== undefined &&
                    arrayFixedBaseSuburbs[destination.suburb] !== null
                      ? arrayFixedBaseSuburbs[destination.suburb]
                      : destination.suburb;

                  modelMetaDataResponse.busiest_destination_suburbs =
                    getInsightStats(
                      trip,
                      destination_number_argument,
                      modelMetaDataResponse.busiest_destination_suburbs,
                      "cancelled"
                    );
                });
                //! ---------------------------------------------------------------------------------------------

                if (/RIDE/i.test(trip.ride_mode)) {
                  //Ride
                  modelMetaDataResponse.genericGlobalStats.total_cancelled_rides += 1;
                } else if (/DELIVERY/i.test(trip.ride_mode)) {
                  //Delivery
                  modelMetaDataResponse.genericGlobalStats.total_cancelled_deliveries += 1;
                }
                //...
                if (/connectme/i.test(trip.connect_type)) {
                  //Connectme
                  modelMetaDataResponse.genericGlobalStats.total_connectme_trips += 1;
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_connectme_rides += 1;
                  }
                } //ConnectUs
                else {
                  modelMetaDataResponse.genericGlobalStats.total_connectus_trips += 1;
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_connectus_rides += 1;
                  }
                }
                //...Schedule
                if (/scheduled/i.test(trip.request_type)) {
                  //Scheduled rides
                  modelMetaDataResponse.genericGlobalStats.total_scheduled_trips += 1;
                  //.
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_scheduled_rides += 1;
                  } else if (/DELIVERY/i.test(trip.ride_mode)) {
                    //Delivery
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_scheduled_deliveries += 1;
                  }
                } //Immediate
                else {
                  modelMetaDataResponse.genericGlobalStats.total_immediate_trips += 1;
                  //.
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_immediate_rides += 1;
                  } else if (/DELIVERY/i.test(trip.ride_mode)) {
                    //Delivery
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_immediate_deliveries += 1;
                  }
                }
                //...Payment method
                if (/cash/i.test(trip.payment_method)) {
                  //Cash
                  modelMetaDataResponse.genericGlobalStats.total_cash_trips += 1;
                  modelMetaDataResponse.genericGlobalStats.total_cash_trips_sales +=
                    parseFloat(trip.fare);
                  //.
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_cash_rides += 1;
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_cash_rides_sales +=
                      parseFloat(trip.fare);
                  } else if (/DELIVERY/i.test(trip.ride_mode)) {
                    //Delivery
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_cash_deliveries += 1;
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_cash_deliveries_sales +=
                      parseFloat(trip.fare);
                  }
                } //Wallet
                else {
                  modelMetaDataResponse.genericGlobalStats.total_wallet_trips += 1;
                  modelMetaDataResponse.genericGlobalStats.total_wallet_trips_sales +=
                    parseFloat(trip.fare);
                  //.
                  if (/RIDE/i.test(trip.ride_mode)) {
                    //Ride
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_wallet_rides += 1;
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_wallet_rides_sales +=
                      parseFloat(trip.fare);
                  } else if (/DELIVERY/i.test(trip.ride_mode)) {
                    //Delivery
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_wallet_deliveries += 1;
                    modelMetaDataResponse.genericGlobalStats.total_cancelled_wallet_deliveries_sales +=
                      parseFloat(trip.fare);
                  }
                }
              });
              //Done for successful rides/deliveries
              resGetTripsInfos(true);
            } //No trip Data
            else {
              resGetTripsInfos("empty_trip_data");
            }
          });
      })
        .then((resultTrips) => {
          // logger.warn(modelMetaDataResponse);
          //! Cache final result
          new Promise((resCache) => {
            redisCluster.set(redisKey, JSON.stringify(modelMetaDataResponse));
            resCache(true);
          })
            .then()
            .catch();
          //....
          resolve(modelMetaDataResponse);
        })
        .catch((error) => {
          logger.error(error);
          resolve("error_getting_stats");
        });
    })
    .catch((error) => {
      logger.error(error);
      resolve("error_getting_stats");
    });
}

/**
 * @func getDailyStats
 * Responsible for packing an processing daily, weekly, monthly, yearly, suburb based or any kind of similarly structured stats
 * @param trip: basic trip data object: successful/cancelled
 * @param day_date_argument: the object argument of the daily view
 * @param modelMetaDataResponseTargeted: the specific object child to modify
 * @param natureTrip: successful or cancelled
 */
function getInsightStats(
  trip,
  day_date_argument,
  modelMetaDataResponseTargeted,
  natureTrip
) {
  modelMetaDataResponseTargeted[day_date_argument] =
    modelMetaDataResponseTargeted[day_date_argument] !== undefined &&
    modelMetaDataResponseTargeted[day_date_argument] !== null
      ? modelMetaDataResponseTargeted[day_date_argument]
      : {
          date_refs: [],
          total_trips: 0, //? Done
          total_successful_trips: 0, //?Done
          total_cancelled_trips: 0, //?Done
          total_connectme_trips: 0, //?Done
          total_connectus_trips: 0, //?Done
          total_scheduled_trips: 0, //?Done
          total_immediate_trips: 0, //? Done
          total_cash_trips: 0, //?Done
          total_wallet_trips: 0, //?done
          //...rides
          total_successful_rides: 0, //?done
          total_cancelled_rides: 0, //?Done
          total_successful_immediate_rides: 0, //?Done
          total_successful_scheduled_rides: 0, //?Done
          total_cancelled_immediate_rides: 0, //?Done
          total_cancelled_scheduled_rides: 0, //?Done
          total_successful_connectme_rides: 0, //?Done
          total_cancelled_connectme_rides: 0, //?Done
          total_successful_connectus_rides: 0, //?Done
          total_cancelled_connectus_rides: 0, //?Done
          total_successful_cash_rides: 0, //?Done
          total_cancelled_cash_rides: 0, //?Done
          total_successful_wallet_rides: 0, //?Done
          total_cancelled_wallet_rides: 0, //?Done
          //...deliveries
          total_successful_deliveries: 0, //?Done
          total_cancelled_deliveries: 0, //?Done
          total_successful_immediate_deliveries: 0, //?Done
          total_successful_scheduled_deliveries: 0, //?Done
          total_cancelled_immediate_deliveries: 0, //?Done
          total_cancelled_scheduled_deliveries: 0, //?Done
          total_successful_cash_deliveries: 0, //?Done
          total_cancelled_cash_deliveries: 0, //?Done
          total_successful_wallet_deliveries: 0, //?Done
          total_cancelled_wallet_deliveries: 0, //?Done
          //...Handling
          percentage_trip_handling: 0, //success/total * 100%
          percentage_rides_handling: 0,
          percentage_deliveries_handling: 0,
          //...drivers/riders
          total_riders: 0,
          total_drivers: 0,
          riders_to_drivers_ratio: 0,
          //...Commission
          total_commission: 0, //Generated by rides during zoom period
          total_commission_collected: 0,
          total_commission_pending: 0,
        };

  if (/successful/i.test(natureTrip)) {
    //successful trips
    modelMetaDataResponseTargeted[day_date_argument].date_refs.push(
      new Date(trip.date_requested)
    );
    modelMetaDataResponseTargeted[day_date_argument].total_trips += 1;
    modelMetaDataResponseTargeted[
      day_date_argument
    ].total_successful_trips += 1;
    //? -------------------------------------------------------------------
    if (/RIDE/i.test(trip.ride_mode)) {
      //Ride
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_successful_rides += 1;
    } else if (/DELIVERY/i.test(trip.ride_mode)) {
      //Delivery
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_successful_deliveries += 1;
    }
    //...
    if (/connectme/i.test(trip.connect_type)) {
      //Connectme
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_connectme_trips += 1;
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_connectme_rides += 1;
      }
    } //ConnectUs
    else {
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_connectus_trips += 1;
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_connectus_rides += 1;
      }
    }
    //...Schedule
    if (/scheduled/i.test(trip.request_type)) {
      //Scheduled rides
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_scheduled_trips += 1;
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_scheduled_rides += 1;
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_scheduled_deliveries += 1;
      }
    } //Immediate
    else {
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_immediate_trips += 1;
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_immediate_rides += 1;
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_immediate_deliveries += 1;
      }
    }
    //...Payment method
    if (/cash/i.test(trip.payment_method)) {
      //Cash
      modelMetaDataResponseTargeted[day_date_argument].total_cash_trips +=
        parseFloat(trip.fare);
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_cash_rides += parseFloat(trip.fare);
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_cash_deliveries += parseFloat(trip.fare);
      }
    } //Wallet
    else {
      modelMetaDataResponseTargeted[day_date_argument].total_wallet_trips +=
        parseFloat(trip.fare);
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_wallet_rides += parseFloat(trip.fare);
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_successful_wallet_deliveries += parseFloat(trip.fare);
      }
    }

    //? DONE
    return modelMetaDataResponseTargeted;
  } //Cancelled Trips
  else {
    modelMetaDataResponseTargeted[day_date_argument].date_refs.push(
      new Date(trip.date_requested)
    );
    modelMetaDataResponseTargeted[day_date_argument].total_trips += 1;
    modelMetaDataResponseTargeted[day_date_argument].total_cancelled_trips += 1;

    if (/RIDE/i.test(trip.ride_mode)) {
      //Ride
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_cancelled_rides += 1;
    } else if (/DELIVERY/i.test(trip.ride_mode)) {
      //Delivery
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_cancelled_deliveries += 1;
    }
    //...
    if (/connectme/i.test(trip.connect_type)) {
      //Connectme
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_connectme_trips += 1;
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_connectme_rides += 1;
      }
    } //ConnectUs
    else {
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_connectus_trips += 1;
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_connectus_rides += 1;
      }
    }
    //...Schedule
    if (/scheduled/i.test(trip.request_type)) {
      //Scheduled rides
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_scheduled_trips += 1;
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_scheduled_rides += 1;
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_scheduled_deliveries += 1;
      }
    } //Immediate
    else {
      modelMetaDataResponseTargeted[
        day_date_argument
      ].total_immediate_trips += 1;
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_immediate_rides += 1;
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_immediate_deliveries += 1;
      }
    }
    //...Payment method
    if (/cash/i.test(trip.payment_method)) {
      //Cash
      modelMetaDataResponseTargeted[day_date_argument].total_cash_trips +=
        parseFloat(trip.fare);
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_cash_rides += parseFloat(trip.fare);
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_cash_deliveries += parseFloat(trip.fare);
      }
    } //Wallet
    else {
      modelMetaDataResponseTargeted[day_date_argument].total_wallet_trips +=
        parseFloat(trip.fare);
      //.
      if (/RIDE/i.test(trip.ride_mode)) {
        //Ride
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_wallet_rides += parseFloat(trip.fare);
      } else if (/DELIVERY/i.test(trip.ride_mode)) {
        //Delivery
        modelMetaDataResponseTargeted[
          day_date_argument
        ].total_cancelled_wallet_deliveries += parseFloat(trip.fare);
      }
    }

    //? Done
    return modelMetaDataResponseTargeted;
  }
}

/**
 * Responsible for sorting objects by keys!
 */
function sortObj(obj) {
  return Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

/**
 * @func makegraphReady
 * Responsible for turning the standard views data to a react-vis graph ready format
 */
function makegraphReady(standardData) {
  //? 1. Sort the data
  standardData = sortObj(standardData);
  //..
  let tmpMetaChildObject = {};
  //...
  Object.keys(standardData).forEach((key) => {
    let tmpReadiness = standardData[key];
    let characteristic_label = key;
    let sorter = new Date(tmpReadiness.date_refs[0]).getTime();
    //...
    Object.keys(tmpReadiness).forEach((key2) => {
      tmpMetaChildObject[key2] =
        tmpMetaChildObject[key2] === undefined ||
        tmpMetaChildObject[key2] === null ||
        tmpMetaChildObject[key2].length === undefined ||
        tmpMetaChildObject[key2].length === null
          ? []
          : tmpMetaChildObject[key2];
      //...
      tmpMetaChildObject[key2].push({
        x: characteristic_label,
        y: tmpReadiness[key2],
        sorter: sorter,
      });
      //? Sort it
      tmpMetaChildObject[key2] = tmpMetaChildObject[key2].sort((a, b) =>
        a.sorter > b.sorter ? 1 : a.sorter < b.sorter ? -1 : 0
      );
    });
  });
  //Done
  return tmpMetaChildObject;
}

var collectionPassengers_profiles = null;
var collectionDrivers_profiles = null;
var collectionRidesDeliveryData = null;
var collectionRidesDeliveryDataCancelled = null;
var collectionOwners = null;
var collectionAdminUsers = null;

redisCluster.on("connect", function () {
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
        .use(helmet())
        .use(cors())
        .use(
          express.json({
            extended: true,
            limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS,
          })
        )
        .use(
          express.urlencoded({
            extended: true,
            limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS,
          })
        );

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
              error:
                "Failed to get rides and deliveries in progress @API level",
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
            res.send({
              error: " Something went wrong while updating the entry",
            });
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

      /**
       * Responsible for getting the summary data
       */
      app.get("/getSummaryAdminGlobal_data", (req, res) => {
        new Promise((resCompute) => {
          let params = urlParser.parse(req.url, true);
          req = params.query;
          //Check for graph readiness - default - false
          req.make_graphReady =
            req.make_graphReady !== undefined && req.make_graphReady !== null
              ? true
              : false;

          getAdminSummaryData(req, resCompute);
        })
          .then((result) => {
            //Isolate response based on the isolation_factor
            new Promise((resTokenize) => {
              //?Generate unique hash representing the current state of the data
              generateUniqueFingerprint(
                `${JSON.stringify(result)}-${JSON.stringify(req)}`,
                "sha256",
                resTokenize
              );
            })
              .then((dataStateHash) => {
                logger.warn(dataStateHash);
                //? Use generic_view by default
                req.isolation_factor =
                  req.isolation_factor !== undefined &&
                  req.isolation_factor !== null
                    ? req.isolation_factor
                    : "generic_view";
                //?...
                if (req.isolation_factor === "req.isolation_factor") {
                  res.send({
                    stateHash: dataStateHash,
                    response: result.genericGlobalStats,
                  });
                } else if (req.isolation_factor === "generic_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      genericGlobalStats: result.genericGlobalStats,
                    },
                  });
                } else if (
                  req.isolation_factor === "generic_view|weekly_view"
                ) {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      genericGlobalStats: result.genericGlobalStats,
                      weekly_view: req.make_graphReady
                        ? makegraphReady(result.weekly_view)
                        : result.weekly_view,
                    },
                  });
                } else if (req.isolation_factor === "weekly_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      weekly_view: req.make_graphReady
                        ? makegraphReady(result.weekly_view)
                        : result.weekly_view,
                    },
                  });
                } else if (req.isolation_factor === "generic_view|daily_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      genericGlobalStats: result.genericGlobalStats,
                      daily_view: req.make_graphReady
                        ? makegraphReady(result.daily_view)
                        : result.daily_view,
                    },
                  });
                } else if (req.isolation_factor === "daily_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      daily_view: req.make_graphReady
                        ? makegraphReady(result.daily_view)
                        : result.daily_view,
                    },
                  });
                } else if (
                  req.isolation_factor === "generic_view|monthly_view"
                ) {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      genericGlobalStats: result.genericGlobalStats,
                      monthly_view: req.make_graphReady
                        ? makegraphReady(result.monthly_view)
                        : result.monthly_view,
                    },
                  });
                } else if (req.isolation_factor === "monthly_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      monthly_view: req.make_graphReady
                        ? makegraphReady(result.monthly_view)
                        : result.monthly_view,
                    },
                  });
                } else if (
                  req.isolation_factor === "generic_view|yearly_view"
                ) {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      genericGlobalStats: result.genericGlobalStats,
                      yearly_view: req.make_graphReady
                        ? makegraphReady(result.yearly_view)
                        : result.yearly_view,
                    },
                  });
                } else if (req.isolation_factor === "yearly_view") {
                  res.send({
                    stateHash: dataStateHash,
                    response: {
                      yearly_view: req.make_graphReady
                        ? makegraphReady(result.yearly_view)
                        : result.yearly_view,
                    },
                  });
                } else if (req.isolation_factor === "all") {
                  //! Too heavy!
                  res.send({ stateHash: dataStateHash, response: result });
                } else {
                  //Generic view
                  res.send({
                    stateHash: dataStateHash,
                    response: result.genericGlobalStats,
                  });
                }
              })
              .catch((error) => {
                logger.error(error);
                res.send({ response: "error" });
              });
          })
          .catch((error) => {
            logger.error(error);
            res.send({ response: "error" });
          });
      });
    }
  );
});

server.listen(process.env.STATS_ROOT, () => {
  logger.info(
    `Main view server up and running at port ${process.env.STATS_ROOT}`
  );
});
