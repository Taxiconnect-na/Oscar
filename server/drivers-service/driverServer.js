// require("newrelic");
const path = require("path");
require("dotenv").config({ path: __dirname + "/./../.env" });
const { logger } = require("../LogService");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
// Import my modules
const utils = require("./utils");
const fs = require("fs");
const certFile = fs.readFileSync(String(process.env.CERT_FILE));
const http = require("http");
const server = http.createServer(app);

const axios = require("axios");
const helmet = require("helmet");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");
const AWS = require("aws-sdk");
const moment = require("moment");
const { promisify } = require("util");
const requestAPI = require("request");

app.use(helmet());
app.use(cors());
app.use(fileUpload());
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
PORT = process.env.DRIVER_ROOT;

const redis = require("redis");
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

/*
 * AWS Bucket credentials
 */
/** 
 ** Normal setup with process.env variables
const BUCKET_NAME_DRIVER = process.env.BACKET_NAME_DRIVER
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ID,
    secretAccessKey: process.env.AWS_S3_SECRET
});

*/
/**
 * * Hard coded keys
 */
//! Criver Buckets to be changed (dev/production)B
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ID,
  secretAccessKey: process.env.AWS_S3_SECRET,
});

/**
 * Responsible for sending push notification to devices
 */
var sendPushUPNotification = function (data) {
  logger.info("Notify data");
  logger.info(data);
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      //logger.info("Response:");
    });
  });

  req.on("error", function (e) {});

  req.write(JSON.stringify(data));
  req.end();
};

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
 *
 * @function addHours : adds a given amount of hours to a date object
 */
Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
//* Windhoek Date and Time
var windhoekDateTime = new Date(new Date().toUTCString()).addHours(2);

/**
 * @function GenerateFingerprint()
 * Generate a unique fingerprint for a given string
 */
function GenerateFingerprint(str, encryption = false, resolve) {
  const description = "TAXICONNECTBASICKEYFINGERPRINTS-DRIVERS-ACCOUNTS";
  const hash = crypto
    .createHmac("sha512WithRSAEncryption", description)
    .update(str)
    .digest("hex");
  resolve(hash);
}

/**
 *
 * @param {array} arrayData : A given array from the rides_deliveries collection
 * @param {return} resolve  : Returns an object of computed values:
 *                              {totalCash: x , totalWallet: y ,totalCashWallet: x+y}
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
}

/**
 *
 * @param {collection} DriversCollection:
 * @param {collection} FilteringCollection
 * @param {return} resolve
 */

function getDriversInfo(DriversCollection, FilteringCollection, resolve) {
  logger.info("Runnnig getDriverinfo() function");

  redisCluster.get("drivers-list", (err, reply) => {
    logger.info("Inside the client.get function");
    if (err) {
      logger.info("ERROR FOUND AT REDIS DRIVERS LIST");
      logger.info(err);
      //*Direct request to database, Then save in redis the output
      DriversCollection.find({})
        .toArray()
        .then((individualsList) => {
          let drivers = individualsList.map((individual) => {
            return new Promise((outcome) => {
              // Get the following:
              const name = individual.name;
              const isDriverSuspended = individual.isDriverSuspended;
              const surname = individual.surname;
              const phone_number = individual.phone_number;
              const taxi_number = individual.cars_data[0].taxi_number;
              const plate_number = individual.cars_data[0].plate_number;
              const car_brand = individual.cars_data[0].car_brand;
              const status = individual.operational_state.status;
              const driver_fingerprint = individual.driver_fingerprint;
              const taxi_picture = individual.cars_data[0].taxi_picture;

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
                        date_requested: { $gte: startOfToday },
                      })
                        .toArray()
                        .then((todaydata) => {
                          const todaytrip = todaydata.length;

                          new Promise((res) => {
                            GetCashWallet(todaydata, res);
                          })
                            .then((todaymoney) => {
                              const todayTotalMoney =
                                todaymoney.totalCashWallet;

                              // Initialize Individual data
                              let Individual_driver = {};

                              // Append data to the Individual driver Object:
                              Individual_driver.name = name;
                              Individual_driver.surname = surname;
                              Individual_driver.phone_number = phone_number;
                              Individual_driver.taxi_number = taxi_number;
                              Individual_driver.taxi_picture = taxi_picture;
                              Individual_driver.plate_number = plate_number;
                              Individual_driver.car_brand = car_brand;
                              Individual_driver.status = status;
                              Individual_driver.driver_fingerprint =
                                driver_fingerprint;
                              Individual_driver.totaltrip = totaltrip;
                              Individual_driver.totalmoney = totalmoney;
                              Individual_driver.todaytrip = todaytrip;
                              Individual_driver.totalMoneyToday =
                                todayTotalMoney;
                              Individual_driver.isDriverSuspended =
                                isDriverSuspended;

                              // Append this driver's info to the drivers list
                              outcome(Individual_driver);
                            })
                            .catch((error) => {
                              logger.info(error);
                              resolve({
                                response: "error",
                                flag: "Invalid_params_maybe",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.info(error);
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            });
          });
          Promise.all(drivers).then(
            (result) => {
              redisCluster.set(
                "drivers-list",
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
        });
    } else if (reply) {
      if (reply !== null) {
        //!! Update cash but do not resolve anything:
        logger.info("updating driver list cache...");
        //*Update result @background in redis from Mongo with a new Promise
        new Promise((unreturned) => {
          DriversCollection.find({})
            .toArray()
            .then((individualsList) => {
              let drivers = individualsList.map((individual) => {
                return new Promise((outcome) => {
                  // Get the following:
                  const name = individual.name;
                  const isDriverSuspended = individual.isDriverSuspended;
                  const surname = individual.surname;
                  const phone_number = individual.phone_number;
                  const taxi_number = individual.cars_data[0].taxi_number;
                  const plate_number = individual.cars_data[0].plate_number;
                  const car_brand = individual.cars_data[0].car_brand;
                  const status = individual.operational_state.status;
                  const driver_fingerprint = individual.driver_fingerprint;
                  const taxi_picture = individual.cars_data[0].taxi_picture;

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
                            date_requested: { $gte: startOfToday },
                          })
                            .toArray()
                            .then((todaydata) => {
                              const todaytrip = todaydata.length;

                              new Promise((res) => {
                                GetCashWallet(todaydata, res);
                              })
                                .then((todaymoney) => {
                                  const todayTotalMoney =
                                    todaymoney.totalCashWallet;

                                  // Initialize Individual data
                                  let Individual_driver = {};

                                  // Append data to the Individual driver Object:
                                  Individual_driver.name = name;
                                  Individual_driver.surname = surname;
                                  Individual_driver.phone_number = phone_number;
                                  Individual_driver.taxi_number = taxi_number;
                                  Individual_driver.taxi_picture = taxi_picture;
                                  Individual_driver.plate_number = plate_number;
                                  Individual_driver.car_brand = car_brand;
                                  Individual_driver.status = status;
                                  Individual_driver.driver_fingerprint =
                                    driver_fingerprint;
                                  Individual_driver.totaltrip = totaltrip;
                                  Individual_driver.totalmoney = totalmoney;
                                  Individual_driver.todaytrip = todaytrip;
                                  Individual_driver.totalMoneyToday =
                                    todayTotalMoney;
                                  Individual_driver.isDriverSuspended =
                                    isDriverSuspended;

                                  // Append this driver's info to the drivers list
                                  outcome(Individual_driver);
                                })
                                .catch((error) => {
                                  logger.info(error);
                                  resolve({
                                    response: "error",
                                    flag: "Invalid_params_maybe",
                                  });
                                });
                            })
                            .catch((error) => {
                              logger.info(error);
                              resolve({
                                response: "error",
                                flag: "Invalid_params_maybe",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.info(error);
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                });
              });
              Promise.all(drivers).then(
                (result) => {
                  redisCluster.set(
                    "drivers-list",
                    JSON.stringify(result),
                    redis.print
                  );
                  //resolve(result)
                },
                (error) => {
                  logger.info(error);
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                }
              );
            })
            .catch((error) => {
              logger.info(error);
            });
        });
        //* Resolve found result
        resolve(JSON.parse(reply));
      } else {
        logger.info("NO CACHE FOUND FOR DRIVERS LIST");
        //* Direct request to Mongo, Then save result
        DriversCollection.find({})
          .toArray()
          .then((individualsList) => {
            let drivers = individualsList.map((individual) => {
              return new Promise((outcome) => {
                // Get the following:
                const name = individual.name;
                const isDriverSuspended = individual.isDriverSuspended;
                const surname = individual.surname;
                const phone_number = individual.phone_number;
                const taxi_number = individual.cars_data[0].taxi_number;
                const plate_number = individual.cars_data[0].plate_number;
                const car_brand = individual.cars_data[0].car_brand;
                const status = individual.operational_state.status;
                const driver_fingerprint = individual.driver_fingerprint;
                const taxi_picture = individual.cars_data[0].taxi_picture;

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
                          date_requested: { $gte: startOfToday },
                        })
                          .toArray()
                          .then((todaydata) => {
                            const todaytrip = todaydata.length;

                            new Promise((res) => {
                              GetCashWallet(todaydata, res);
                            })
                              .then((todaymoney) => {
                                const todayTotalMoney =
                                  todaymoney.totalCashWallet;

                                // Initialize Individual data
                                let Individual_driver = {};

                                // Append data to the Individual driver Object:
                                Individual_driver.name = name;
                                Individual_driver.surname = surname;
                                Individual_driver.phone_number = phone_number;
                                Individual_driver.taxi_number = taxi_number;
                                Individual_driver.taxi_picture = taxi_picture;
                                Individual_driver.plate_number = plate_number;
                                Individual_driver.car_brand = car_brand;
                                Individual_driver.status = status;
                                Individual_driver.driver_fingerprint =
                                  driver_fingerprint;
                                Individual_driver.totaltrip = totaltrip;
                                Individual_driver.totalmoney = totalmoney;
                                Individual_driver.todaytrip = todaytrip;
                                Individual_driver.totalMoneyToday =
                                  todayTotalMoney;
                                Individual_driver.isDriverSuspended =
                                  isDriverSuspended;

                                // Append this driver's info to the drivers list
                                outcome(Individual_driver);
                              })
                              .catch((error) => {
                                logger.info(error);
                                resolve({
                                  response: "error",
                                  flag: "Invalid_params_maybe",
                                });
                              });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              response: "error",
                              flag: "Invalid_params_maybe",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.info(error);
                        resolve({
                          response: "error",
                          flag: "Invalid_params_maybe",
                        });
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                    resolve({
                      response: "error",
                      flag: "Invalid_params_maybe",
                    });
                  });
              });
            });
            Promise.all(drivers).then(
              (result) => {
                redisCluster.set(
                  "drivers-list",
                  JSON.stringify(result),
                  redis.print
                );
                resolve(result);
              },
              (error) => {
                logger.info(error);
                resolve({ response: "error", flag: "Invalid_params_maybe" });
              }
            );
          })
          .catch((error) => {
            logger.info(error);
          });
      }
    } else {
      //*Direct request to database, Then save in redis the output
      DriversCollection.find({})
        .toArray()
        .then((individualsList) => {
          let drivers = individualsList.map((individual) => {
            return new Promise((outcome) => {
              // Get the following:
              const name = individual.name;
              const isDriverSuspended = individual.isDriverSuspended;
              const surname = individual.surname;
              const phone_number = individual.phone_number;
              const taxi_number = individual.cars_data[0].taxi_number;
              const plate_number = individual.cars_data[0].plate_number;
              const car_brand = individual.cars_data[0].car_brand;
              const status = individual.operational_state.status;
              const driver_fingerprint = individual.driver_fingerprint;
              const taxi_picture = individual.cars_data[0].taxi_picture;

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
                        date_requested: { $gte: startOfToday },
                      })
                        .toArray()
                        .then((todaydata) => {
                          const todaytrip = todaydata.length;

                          new Promise((res) => {
                            GetCashWallet(todaydata, res);
                          })
                            .then((todaymoney) => {
                              const todayTotalMoney =
                                todaymoney.totalCashWallet;

                              // Initialize Individual data
                              let Individual_driver = {};

                              // Append data to the Individual driver Object:
                              Individual_driver.name = name;
                              Individual_driver.surname = surname;
                              Individual_driver.phone_number = phone_number;
                              Individual_driver.taxi_number = taxi_number;
                              Individual_driver.taxi_picture = taxi_picture;
                              Individual_driver.plate_number = plate_number;
                              Individual_driver.car_brand = car_brand;
                              Individual_driver.status = status;
                              Individual_driver.driver_fingerprint =
                                driver_fingerprint;
                              Individual_driver.totaltrip = totaltrip;
                              Individual_driver.totalmoney = totalmoney;
                              Individual_driver.todaytrip = todaytrip;
                              Individual_driver.totalMoneyToday =
                                todayTotalMoney;
                              Individual_driver.isDriverSuspended =
                                isDriverSuspended;

                              // Append this driver's info to the drivers list
                              outcome(Individual_driver);
                            })
                            .catch((error) => {
                              logger.info(error);
                              resolve({
                                response: "error",
                                flag: "Invalid_params_maybe",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.info(error);
                          resolve({
                            response: "error",
                            flag: "Invalid_params_maybe",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      resolve({
                        response: "error",
                        flag: "Invalid_params_maybe",
                      });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({ response: "error", flag: "Invalid_params_maybe" });
                });
            });
          });
          Promise.all(drivers).then(
            (result) => {
              redisCluster.set(
                "drivers-list",
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            },
            (error) => {
              logger.info(error);
              resolve({ response: "error", flag: "Invalid_params_maybe" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
        });
    }
  });
}

/**
 * @function GenerateUnique : Generates a random 6 digits number which is not in the paymentNumbersList
 * @param {array} paymentNumbersList
 * @param {return} resolve
 */

function GenerateUnique(paymentNumbersList, resolve) {
  try {
    randomGen = Math.floor(Math.random() * 1000000 + 1);

    if (paymentNumbersList.includes(randomGen)) {
      logger.info(`********************** ${random} is taken *************`);
      GenerateUnique(array, resolve);
    } else {
      resolve(randomGen);
    }
  } catch (error) {
    resolve({ error: "something went wrong" });
  }
}

/**
 * @function CreatePaymentNumber : Returns a random number after checking availability in DB
 * @param {collection} collectionDrivers_profiles
 * @param {return} resolve
 */

function CreatePaymentNumber(collectionDrivers_profiles, resolve) {
  collectionDrivers_profiles
    .find({})
    .toArray()
    .then((drivers) => {
      let driversNumber = drivers.map((driver) => {
        return new Promise((outcome) => {
          const number = driver.identification_data
            ? driver.identification_data.personal_id_number
            : null;
          outcome(number);
        });
      });

      Promise.all(driversNumber)
        .then((result) => {
          logger.info("Getting payment numbers...");

          new Promise((res) => {
            GenerateUnique(result, res);
          }).then(
            (generated) => {
              logger.info(`Generated number: ${generated}`);
              // return the generated number as a string
              resolve(generated.toString());
            },
            (error) => {
              logger.info(error);
              resolve({ message: "error occured during generation" });
            }
          );
          //resolve(result)
        })
        .catch((error) => {
          logger.info(error);
          resolve({ message: "error occured before generation" });
        });
    })
    .catch((error) => {
      logger.info(error);
      resolve({ message: "error occured in createPaymentNUmber func" });
    });
}

/**
 * @function InsertcashPayment: Insert the amount due to driver from his wallet.
 *  This is basically the driver's money in his wallet that we owe him
 *  Initially drivers would come to the office to get the money from above NAD 100
 * When a driver is given his NAD100, this object is inserted
 * @param {collection} driversCollection
 * @param {collection} walletTransactionsLogsCollection
 * @param {object} query
 * @param {number} amount
 * @param {return} resolve
 */

function InsertcashPayment(
  driversCollection,
  walletTransactionsLogsCollection,
  query,
  amount,
  resolve
) {
  // Initialize transaction object
  const transaction = {};
  // make query
  driversCollection
    .findOne(query)
    .then((result) => {
      if (result) {
        const money = amount;
        const user_fingerprint = result.driver_fingerprint; //
        const recipient_fp = result.driver_fingerprint;
        const payment_currency = "NAD"; //
        const transaction_nature = "weeklyPaidDriverAutomatic";
        const date_captured = new Date().addHours(2);
        const timestamp = new Date().addHours(2).getTime();

        transaction.user_fingerprint = user_fingerprint;
        transaction.transaction_fp =
          result.driver_fingerprint + new Date().addHours(2).getTime();
        transaction.payment_currency = payment_currency; //
        transaction.transaction_nature = transaction_nature;
        transaction.date_captured = date_captured;
        transaction.timestamp = timestamp;
        transaction.amount = money; //

        // Insert transaction into db
        walletTransactionsLogsCollection
          .insertOne(transaction)
          .then((next) => {
            resolve(
              `++++++++++++ ONE CASH PAYMENT OF [  N$ ${amount}  ] BY ${result.name} inserted ++++++++++++++++`
            );
          })
          .catch((error) => {
            logger.info(error);
            resolve({ error: "Seems like wrong parameters @db query" });
          });
      } else {
        resolve({ error: "driver not found" });
      }
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "Seems like wrong parameters" });
    });
}

/**
 * @function uploadFile: Takes is a file object and saves its name and content to AWS S3 bucket
 * @param {file} fileObject
 * @param {string} subdir : subdirectory of the bucket
 * @param {string} driverFingerPrint : generated fingerprint of the driver upon registration
 * @param {string} papercategory : category of the paper, options: white_paper, blue_paper, etc.
 */
function uploadFile(
  fileObject,
  subdir,
  driverFingerPrint,
  paperCategory,
  fileName,
  resolve
) {
  logger.info("UPLOADING FILE TO AWS S3 BUCKET");
  // Setting up S3 upload parameters
  const params = {
    Bucket: `${process.env.BUCKET_NAME_DRIVER}/${subdir}`,
    Key: `${driverFingerPrint}-${paperCategory}` + fileName,
    Body: fileObject, // File data of the file object (actual object)
  };

  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      logger.info(err);
      resolve({ error: "File upload to s3 bucket failed" });
    } else {
      logger.info(`${params.Key} successfully uploaded @ ${data.Location}`);
      resolve({ success: "File upload to s3 bucket successful" });
    }
  });
}

function getCancelledRidesDriverEvent(
  collectionGlobalEvents,
  collectionRidesDeliveryDataCancelled,
  collectionRidesDeliveryData,
  collectionPassengers_profiles,
  collectionDrivers_profiles,
  resolve
) {
  logger.info(" Runnig getCancelledRidesDriverEvent function");
  redisCluster.get("cancelled-rides-by-driver", (err, reply) => {
    if (err) {
      logger.info(err);
      logger.info("An error occured at redis level");
      //*Direct request to database, Then save in redis the output
      collectionGlobalEvents
        .find({ event_name: "driver_cancelling_request" })
        .sort({ date: -1 })
        .limit(1000)
        .toArray()
        .then((events) => {
          //resolve(events)

          //For each event, get the following:
          const allCancelledRidesByDriver = events.map((event) => {
            return new Promise((res1) => {
              const request_fp = event.request_fp;
              const driver_fingerprint = event.driver_fingerprint;
              const date_cancelled = event.date;

              collectionRidesDeliveryDataCancelled
                .findOne({ request_fp: event.request_fp })
                .then((cancelled) => {
                  if (cancelled !== null) {
                    //!This is when it has been cancelled by Passenger as well
                    logger.info(
                      "cancelled ride found @cancelled rides collection"
                    );
                    const date_requested = cancelled
                      ? cancelled.date_requested
                      : "not found";
                    //const carTypeSelected = cancelled.carTypeSelected
                    const passengers_number = cancelled
                      ? cancelled.passengers_number
                      : "not found";
                    const connect_type = cancelled
                      ? cancelled.connect_type
                      : "not found";
                    const origin = cancelled
                      ? cancelled.pickup_location_infos.suburb
                      : "not found";
                    const destination = cancelled
                      ? cancelled.destinationData.map((destination) => {
                          return destination.suburb;
                        })
                      : "not found";
                    const fare = cancelled ? cancelled.fare : "not found";

                    queryPassenger = { user_fingerprint: cancelled.client_id };
                    collectionPassengers_profiles
                      .findOne(queryPassenger)
                      .then((passenger) => {
                        const passenger_name = passenger
                          ? passenger.name
                          : "not found";
                        const passenger_phone_number = passenger
                          ? passenger.phone_number
                          : "not found";
                        // Get the driver info in case ride was accepted before cancellation

                        collectionDrivers_profiles
                          .findOne({ driver_fingerprint: driver_fingerprint })
                          .then((driver) => {
                            const taxi_number = driver
                              ? driver.cars_data[0]["taxi_number"]
                              : "not found";
                            const driver_name = driver
                              ? driver.name
                              : "not found";
                            const driver_phone_number = driver
                              ? driver.phone_number
                              : "not found";

                            //Return the final object
                            res1({
                              date_cancelled,
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
                              driver_phone_number,
                              isRideExisting: false, //Ride is No longer present to be accepted by another
                            });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.info(error);
                        resolve({
                          success: false,
                          error: "Failed @getAllCancelled rides function level",
                        });
                      });
                  } else {
                    //Ride not yet cancelled on passenger's side:

                    collectionRidesDeliveryData
                      .findOne({ request_fp: event.request_fp })
                      .then((cancelled) => {
                        const date_requested = cancelled
                          ? cancelled.date_requested
                          : "not found";
                        //const carTypeSelected = cancelled.carTypeSelected
                        const passengers_number = cancelled
                          ? cancelled.passengers_number
                          : "not found";
                        const connect_type = cancelled
                          ? cancelled.connect_type
                          : "not found";
                        const origin = cancelled
                          ? cancelled.pickup_location_infos.suburb
                          : "not found";
                        const destination = cancelled
                          ? cancelled.destinationData.map((destination) => {
                              return destination.suburb;
                            })
                          : "not found";
                        const fare = cancelled ? cancelled.fare : "not found";

                        queryPassenger = {
                          user_fingerprint: cancelled.client_id,
                        };
                        collectionPassengers_profiles
                          .findOne(queryPassenger)
                          .then((passenger) => {
                            const passenger_name = passenger
                              ? passenger.name
                              : "not found";
                            const passenger_phone_number = passenger
                              ? passenger.phone_number
                              : "not found";
                            // Get the driver info in case ride was accepted before cancellation

                            collectionDrivers_profiles
                              .findOne({
                                driver_fingerprint: driver_fingerprint,
                              })
                              .then((driver) => {
                                const taxi_number = driver
                                  ? driver.cars_data[0]["taxi_number"]
                                  : "not found";
                                const driver_name = driver
                                  ? driver.name
                                  : "not found";
                                const driver_phone_number = driver
                                  ? driver.phone_number
                                  : "not found";

                                //Return the final object
                                res1({
                                  date_cancelled,
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
                                  driver_phone_number,
                                  isRideExisting: true, //Ride is No longer present to be accepted by another
                                });
                              })
                              .catch((error) => {
                                logger.info(error);
                                resolve({
                                  success: false,
                                  error:
                                    "Failed @getAllCancelled rides function level",
                                });
                              });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.error(`error: ${error.message}`);
                        resolve({
                          success: false,
                          error: "Failed @getAllCancelled rides function level",
                        });
                      });
                  }
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({
                    success: false,
                    error: "Failed @getAllCancelled rides function level",
                  });
                });
            });
          });

          Promise.all(allCancelledRidesByDriver)
            .then((result) => {
              //logger.info(result)
              redisCluster.set(
                "cancelled-rides-by-driver",
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({
                success: false,
                error: "Failed @getAllCancelled rides function level",
              });
            });
        })
        .catch((error) => {
          logger.error(error);
          resolve({
            success: false,
            error: "Failed to get all events@collectionGlobalEvents query",
          });
        });
    } else if (reply) {
      if (reply !== null) {
        //* Resolve found result
        resolve(JSON.parse(reply));
        //!! Update cash but do not resolve anything:
        logger.info("updating cancelled-rides-by-driver cache");
        //*Update result @background in redis from Mongo with a new Promise
        new Promise((unreturned) => {
          collectionGlobalEvents
            .find({ event_name: "driver_cancelling_request" })
            .sort({ date: -1 })
            .limit(1000)
            .toArray()
            .then((events) => {
              //resolve(events)

              //For each event, get the following:
              const allCancelledRidesByDriver = events.map((event) => {
                return new Promise((res1) => {
                  const request_fp = event.request_fp;
                  const driver_fingerprint = event.driver_fingerprint;
                  const date_cancelled = event.date;

                  collectionRidesDeliveryDataCancelled
                    .findOne({ request_fp: event.request_fp })
                    .then((cancelled) => {
                      if (cancelled !== null) {
                        //!This is when it has been cancelled by Passenger as well
                        const date_requested = cancelled
                          ? cancelled.date_requested
                          : "not found";
                        //const carTypeSelected = cancelled.carTypeSelected
                        const passengers_number = cancelled
                          ? cancelled.passengers_number
                          : "not found";
                        const connect_type = cancelled
                          ? cancelled.connect_type
                          : "not found";
                        const origin = cancelled
                          ? cancelled.pickup_location_infos.suburb
                          : "not found";
                        const destination = cancelled
                          ? cancelled.destinationData.map((destination) => {
                              return destination.suburb;
                            })
                          : "not found";
                        const fare = cancelled ? cancelled.fare : "not found";

                        queryPassenger = {
                          user_fingerprint: cancelled.client_id,
                        };
                        collectionPassengers_profiles
                          .findOne(queryPassenger)
                          .then((passenger) => {
                            const passenger_name = passenger
                              ? passenger.name
                              : "not found";
                            const passenger_phone_number = passenger
                              ? passenger.phone_number
                              : "not found";
                            // Get the driver info in case ride was accepted before cancellation

                            collectionDrivers_profiles
                              .findOne({
                                driver_fingerprint: driver_fingerprint,
                              })
                              .then((driver) => {
                                const taxi_number = driver
                                  ? driver.cars_data[0]["taxi_number"]
                                  : "not found";
                                const driver_name = driver
                                  ? driver.name
                                  : "not found";
                                const driver_phone_number = driver
                                  ? driver.phone_number
                                  : "not found";

                                //Return the final object
                                res1({
                                  date_cancelled,
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
                                  driver_phone_number,
                                  isRideExisting: false, //Ride is No longer present to be accepted by another
                                });
                              })
                              .catch((error) => {
                                logger.info(error);
                                resolve({
                                  success: false,
                                  error:
                                    "Failed @getAllCancelled rides function level",
                                });
                              });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      } else {
                        //Ride not yet cancelled on passenger's side:

                        collectionRidesDeliveryData
                          .findOne({ request_fp: event.request_fp })
                          .then((cancelled) => {
                            const date_requested = cancelled
                              ? cancelled.date_requested
                              : "not found";
                            //const carTypeSelected = cancelled.carTypeSelected
                            const passengers_number = cancelled
                              ? cancelled.passengers_number
                              : "not found";
                            const connect_type = cancelled
                              ? cancelled.connect_type
                              : "not found";
                            const origin = cancelled
                              ? cancelled.pickup_location_infos.suburb
                              : "not found";
                            const destination = cancelled
                              ? cancelled.destinationData.map((destination) => {
                                  return destination.suburb;
                                })
                              : "not found";
                            const fare = cancelled
                              ? cancelled.fare
                              : "not found";

                            queryPassenger = {
                              user_fingerprint: cancelled.client_id,
                            };
                            collectionPassengers_profiles
                              .findOne(queryPassenger)
                              .then((passenger) => {
                                const passenger_name = passenger
                                  ? passenger.name
                                  : "not found";
                                const passenger_phone_number = passenger
                                  ? passenger.phone_number
                                  : "not found";
                                // Get the driver info in case ride was accepted before cancellation

                                collectionDrivers_profiles
                                  .findOne({
                                    driver_fingerprint: driver_fingerprint,
                                  })
                                  .then((driver) => {
                                    const taxi_number = driver
                                      ? driver.cars_data[0]["taxi_number"]
                                      : "not found";
                                    const driver_name = driver
                                      ? driver.name
                                      : "not found";
                                    const driver_phone_number = driver
                                      ? driver.phone_number
                                      : "not found";

                                    //Return the final object
                                    res1({
                                      date_cancelled,
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
                                      driver_phone_number,
                                      isRideExisting: true, //Ride is No longer present to be accepted by another
                                    });
                                  })
                                  .catch((error) => {
                                    logger.info(error);
                                    resolve({
                                      success: false,
                                      error:
                                        "Failed @getAllCancelled rides function level",
                                    });
                                  });
                              })
                              .catch((error) => {
                                logger.info(error);
                                resolve({
                                  success: false,
                                  error:
                                    "Failed @getAllCancelled rides function level",
                                });
                              });
                          })
                          .catch((error) => {
                            logger.error(`error: ${error.message}`);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      }
                    })
                    .catch((error) => {
                      logger.info(error);
                      resolve({
                        success: false,
                        error: "Failed @getAllCancelled rides function level",
                      });
                    });
                });
              });

              Promise.all(allCancelledRidesByDriver)
                .then((result) => {
                  //logger.info(result)
                  redisCluster.set(
                    "cancelled-rides-by-driver",
                    JSON.stringify(result),
                    redis.print
                  );
                  //resolve(result)
                })
                .catch((error) => {
                  logger.error(error);
                  resolve({
                    success: false,
                    error: "Failed @getAllCancelled rides function level",
                  });
                });
            })
            .catch((error) => {
              logger.error(error);
              resolve({
                success: false,
                error: "Failed to get all events@collectionGlobalEvents query",
              });
            });
        });
      } else {
        //* Direct request to Mongo, Then save result
        collectionGlobalEvents
          .find({ event_name: "driver_cancelling_request" })
          .sort({ date: -1 })
          .limit(1000)
          .toArray()
          .then((events) => {
            //resolve(events)

            //For each event, get the following:
            const allCancelledRidesByDriver = events.map((event) => {
              return new Promise((res1) => {
                const request_fp = event.request_fp;
                const driver_fingerprint = event.driver_fingerprint;
                const date_cancelled = event.date;

                collectionRidesDeliveryDataCancelled
                  .findOne({ request_fp: event.request_fp })
                  .then((cancelled) => {
                    if (cancelled !== null) {
                      //!This is when it has been cancelled by Passenger as well
                      const date_requested = cancelled
                        ? cancelled.date_requested
                        : "not found";
                      //const carTypeSelected = cancelled.carTypeSelected
                      const passengers_number = cancelled
                        ? cancelled.passengers_number
                        : "not found";
                      const connect_type = cancelled
                        ? cancelled.connect_type
                        : "not found";
                      const origin = cancelled
                        ? cancelled.pickup_location_infos.suburb
                        : "not found";
                      const destination = cancelled
                        ? cancelled.destinationData.map((destination) => {
                            return destination.suburb;
                          })
                        : "not found";
                      const fare = cancelled ? cancelled.fare : "not found";

                      queryPassenger = {
                        user_fingerprint: cancelled.client_id,
                      };
                      collectionPassengers_profiles
                        .findOne(queryPassenger)
                        .then((passenger) => {
                          const passenger_name = passenger
                            ? passenger.name
                            : "not found";
                          const passenger_phone_number = passenger
                            ? passenger.phone_number
                            : "not found";
                          // Get the driver info in case ride was accepted before cancellation

                          collectionDrivers_profiles
                            .findOne({ driver_fingerprint: driver_fingerprint })
                            .then((driver) => {
                              const taxi_number = driver
                                ? driver.cars_data[0]["taxi_number"]
                                : "not found";
                              const driver_name = driver
                                ? driver.name
                                : "not found";
                              const driver_phone_number = driver
                                ? driver.phone_number
                                : "not found";

                              //Return the final object
                              res1({
                                date_cancelled,
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
                                driver_phone_number,
                                isRideExisting: false, //Ride is No longer present to be accepted by another
                              });
                            })
                            .catch((error) => {
                              logger.info(error);
                              resolve({
                                success: false,
                                error:
                                  "Failed @getAllCancelled rides function level",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.info(error);
                          resolve({
                            success: false,
                            error:
                              "Failed @getAllCancelled rides function level",
                          });
                        });
                    } else {
                      //Ride not yet cancelled on passenger's side:

                      collectionRidesDeliveryData
                        .findOne({ request_fp: event.request_fp })
                        .then((cancelled) => {
                          const date_requested = cancelled
                            ? cancelled.date_requested
                            : "not found";
                          //const carTypeSelected = cancelled.carTypeSelected
                          const passengers_number = cancelled
                            ? cancelled.passengers_number
                            : "not found";
                          const connect_type = cancelled
                            ? cancelled.connect_type
                            : "not found";
                          const origin = cancelled
                            ? cancelled.pickup_location_infos.suburb
                            : "not found";
                          const destination = cancelled
                            ? cancelled.destinationData.map((destination) => {
                                return destination.suburb;
                              })
                            : "not found";
                          const fare = cancelled ? cancelled.fare : "not found";

                          queryPassenger = {
                            user_fingerprint: cancelled.client_id,
                          };
                          collectionPassengers_profiles
                            .findOne(queryPassenger)
                            .then((passenger) => {
                              const passenger_name = passenger
                                ? passenger.name
                                : "not found";
                              const passenger_phone_number = passenger
                                ? passenger.phone_number
                                : "not found";
                              // Get the driver info in case ride was accepted before cancellation

                              collectionDrivers_profiles
                                .findOne({
                                  driver_fingerprint: driver_fingerprint,
                                })
                                .then((driver) => {
                                  const taxi_number = driver
                                    ? driver.cars_data[0]["taxi_number"]
                                    : "not found";
                                  const driver_name = driver
                                    ? driver.name
                                    : "not found";
                                  const driver_phone_number = driver
                                    ? driver.phone_number
                                    : "not found";

                                  //Return the final object
                                  res1({
                                    date_cancelled,
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
                                    driver_phone_number,
                                    isRideExisting: true, //Ride is No longer present to be accepted by another
                                  });
                                })
                                .catch((error) => {
                                  logger.info(error);
                                  resolve({
                                    success: false,
                                    error:
                                      "Failed @getAllCancelled rides function level",
                                  });
                                });
                            })
                            .catch((error) => {
                              logger.info(error);
                              resolve({
                                success: false,
                                error:
                                  "Failed @getAllCancelled rides function level",
                              });
                            });
                        })
                        .catch((error) => {
                          logger.error(`error: ${error.message}`);
                          resolve({
                            success: false,
                            error:
                              "Failed @getAllCancelled rides function level",
                          });
                        });
                    }
                  })
                  .catch((error) => {
                    logger.info(error);
                    resolve({
                      success: false,
                      error: "Failed @getAllCancelled rides function level",
                    });
                  });
              });
            });

            Promise.all(allCancelledRidesByDriver)
              .then((result) => {
                //logger.info(result)
                redisCluster.set(
                  "cancelled-rides-by-driver",
                  JSON.stringify(result),
                  redis.print
                );
                resolve(result);
              })
              .catch((error) => {
                logger.error(error);
                resolve({
                  success: false,
                  error: "Failed @getAllCancelled rides function level",
                });
              });
          })
          .catch((error) => {
            logger.error(error);
            resolve({
              success: false,
              error: "Failed to get all events@collectionGlobalEvents query",
            });
          });
      }
    } else {
      //*Direct request to database, Then save in redis the output

      collectionGlobalEvents
        .find({ event_name: "driver_cancelling_request" })
        .sort({ date: -1 })
        .limit(1000)
        .toArray()
        .then((events) => {
          //resolve(events)

          //For each event, get the following:
          const allCancelledRidesByDriver = events.map((event) => {
            return new Promise((res1) => {
              const request_fp = event.request_fp;
              const driver_fingerprint = event.driver_fingerprint;
              const date_cancelled = event.date;

              collectionRidesDeliveryDataCancelled
                .findOne({ request_fp: event.request_fp })
                .then((cancelled) => {
                  if (cancelled !== null) {
                    //!This is when it has been cancelled by Passenger as well
                    const date_requested = cancelled
                      ? cancelled.date_requested
                      : "not found";
                    //const carTypeSelected = cancelled.carTypeSelected
                    const passengers_number = cancelled
                      ? cancelled.passengers_number
                      : "not found";
                    const connect_type = cancelled
                      ? cancelled.connect_type
                      : "not found";
                    const origin = cancelled
                      ? cancelled.pickup_location_infos.suburb
                      : "not found";
                    const destination = cancelled
                      ? cancelled.destinationData.map((destination) => {
                          return destination.suburb;
                        })
                      : "not found";
                    const fare = cancelled ? cancelled.fare : "not found";

                    queryPassenger = { user_fingerprint: cancelled.client_id };
                    collectionPassengers_profiles
                      .findOne(queryPassenger)
                      .then((passenger) => {
                        const passenger_name = passenger
                          ? passenger.name
                          : "not found";
                        const passenger_phone_number = passenger
                          ? passenger.phone_number
                          : "not found";
                        // Get the driver info in case ride was accepted before cancellation

                        collectionDrivers_profiles
                          .findOne({ driver_fingerprint: driver_fingerprint })
                          .then((driver) => {
                            const taxi_number = driver
                              ? driver.cars_data[0]["taxi_number"]
                              : "not found";
                            const driver_name = driver
                              ? driver.name
                              : "not found";
                            const driver_phone_number = driver
                              ? driver.phone_number
                              : "not found";

                            //Return the final object
                            res1({
                              date_cancelled,
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
                              driver_phone_number,
                              isRideExisting: false, //Ride is No longer present to be accepted by another
                            });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.info(error);
                        resolve({
                          success: false,
                          error: "Failed @getAllCancelled rides function level",
                        });
                      });
                  } else {
                    //Ride not yet cancelled on passenger's side:

                    collectionRidesDeliveryData
                      .findOne({ request_fp: event.request_fp })
                      .then((cancelled) => {
                        const date_requested = cancelled
                          ? cancelled.date_requested
                          : "not found";
                        //const carTypeSelected = cancelled.carTypeSelected
                        const passengers_number = cancelled
                          ? cancelled.passengers_number
                          : "not found";
                        const connect_type = cancelled
                          ? cancelled.connect_type
                          : "not found";
                        const origin = cancelled
                          ? cancelled.pickup_location_infos.suburb
                          : "not found";
                        const destination = cancelled
                          ? cancelled.destinationData.map((destination) => {
                              return destination.suburb;
                            })
                          : "not found";
                        const fare = cancelled ? cancelled.fare : "not found";

                        queryPassenger = {
                          user_fingerprint: cancelled.client_id,
                        };
                        collectionPassengers_profiles
                          .findOne(queryPassenger)
                          .then((passenger) => {
                            const passenger_name = passenger
                              ? passenger.name
                              : "not found";
                            const passenger_phone_number = passenger
                              ? passenger.phone_number
                              : "not found";
                            // Get the driver info in case ride was accepted before cancellation

                            collectionDrivers_profiles
                              .findOne({
                                driver_fingerprint: driver_fingerprint,
                              })
                              .then((driver) => {
                                const taxi_number = driver
                                  ? driver.cars_data[0]["taxi_number"]
                                  : "not found";
                                const driver_name = driver
                                  ? driver.name
                                  : "not found";
                                const driver_phone_number = driver
                                  ? driver.phone_number
                                  : "not found";

                                //Return the final object
                                res1({
                                  date_cancelled,
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
                                  driver_phone_number,
                                  isRideExisting: true, //Ride is No longer present to be accepted by another
                                });
                              })
                              .catch((error) => {
                                logger.info(error);
                                resolve({
                                  success: false,
                                  error:
                                    "Failed @getAllCancelled rides function level",
                                });
                              });
                          })
                          .catch((error) => {
                            logger.info(error);
                            resolve({
                              success: false,
                              error:
                                "Failed @getAllCancelled rides function level",
                            });
                          });
                      })
                      .catch((error) => {
                        logger.error(`error: ${error.message}`);
                        resolve({
                          success: false,
                          error: "Failed @getAllCancelled rides function level",
                        });
                      });
                  }
                })
                .catch((error) => {
                  logger.info(error);
                  resolve({
                    success: false,
                    error: "Failed @getAllCancelled rides function level",
                  });
                });
            });
          });

          Promise.all(allCancelledRidesByDriver)
            .then((result) => {
              //logger.info(result)
              redisCluster.set(
                "cancelled-rides-by-driver",
                JSON.stringify(result),
                redis.print
              );
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({
                success: false,
                error: "Failed @getAllCancelled rides function level",
              });
            });
        })
        .catch((error) => {
          logger.error(error);
          resolve({
            success: false,
            error: "Failed to get all events@collectionGlobalEvents query",
          });
        });
    }
  });
}

/**
 * @func getGeneralDrivers_analytics
 * Responsible for getting the general drivers number analytics: like total drivers, all drivers numbers, all drivers fp and so on.
 * @param requestData: the request data containing infos like the admin fingerprint, and the op
 * @param resolve
 */
function getGeneralDrivers_analytics(requestData, resolve) {
  if (/getNumbers_andFp/i.test(requestData.op)) {
    //Get the drivers numbers and fiingerprints
    let redisKey = `cached_driversNumbers_and_fingerprints_generalData`;

    redisGet(redisKey)
      .then((resp) => {
        if (resp !== null) {
          //Found some cached data
          try {
            //Rehydate
            new Promise((resCompute) => {
              execGetGeneralDrivers_analytics(
                requestData,
                redisKey,
                resCompute
              );
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
            //Get fresh data
            new Promise((resCompute) => {
              execGetGeneralDrivers_analytics(
                requestData,
                redisKey,
                resCompute
              );
            })
              .then((result) => {
                resolve(result);
              })
              .catch((error) => {
                logger.error(error);
                resolve({ response: "error" });
              });
          }
        } //Get fresh data
        else {
          new Promise((resCompute) => {
            execGetGeneralDrivers_analytics(requestData, redisKey, resCompute);
          })
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error" });
            });
        }
      })
      .catch((error) => {
        logger.error(error);
        resolve({ response: "error" });
      });
  } //Invalid Data
  else {
    resolve({ response: "error_invalid_oop" });
  }
}

/**
 * @func execGetGeneralDrivers_analytics
 * Responsible for actively getting the drivers general analytics
 * @param requestData: the request data containing infos like the admin fingerprint, and the op
 * @param redisKey: the specific redis key to cache the data to
 * @param resolve
 */
function execGetGeneralDrivers_analytics(requestData, redisKey, resolve) {
  if (/getNumbers_andFp/i.test(requestData.op)) {
    //Get the drivers numbers and fiingerprints
    collectionDrivers_profiles.find({}).toArray(function (err, driverData) {
      if (err) {
        logger.error(err);
        resolve({ response: "error" });
      }
      //...
      if (driverData !== undefined && driverData.length > 0) {
        //Found some drivers
        let filteredData = [];
        driverData.map((driver) => {
          let tmpData = {
            taxi_no: driver.cars_data[0].taxi_number,
            driver_fp: driver.driver_fingerprint,
          };
          //...
          filteredData.push(tmpData);
        });
        //...Cache
        let finalData = { response: "success", data: filteredData };
        new Promise((resCache) => {
          redisCluster.setex(
            redisKey,
            parseInt(process.env.REDIS_EXPIRATION_5MIN) * 1440,
            JSON.stringify(finalData)
          );
          resCache(true);
        })
          .then()
          .catch();
        //...
        resolve(finalData);
      } //No drivers found
      else {
        resolve({ response: "error_no_drivers_found" });
      }
    });
  } //Invalid Data
  else {
    resolve({ response: "error_invalid_oop" });
  }
}

/**
 * @func broadcastNotifications
 * Responsible for broadcasting the notifications to the specific audiences.
 * @param requestData: will contain all the necessary request data
 * @param resolve
 */
function broadcastNotifications(requestData, resolve) {
  resolveDate();
  if (
    requestData.admin_fp !== undefined &&
    requestData.admin_fp !== null &&
    /drivers/i.test(requestData.audience)
  ) {
    //Okay
    //?Check if the admin exists
    collectionAdminCentral
      .find({ admin_fp: requestData.admin_fp })
      .toArray(function (err, adminData) {
        if (err) {
          logger.error(err);
          resolve({ response: "error_adm" });
        }
        //...
        if (adminData !== undefined && adminData.length > 0) {
          //Valid admin
          //Compute the notification fingerprint
          new Promise((resFp) => {
            let uniqueNotifString = `${JSON.stringify(
              requestData
            )}-${new Date().getTime()}`;
            generateUniqueFingerprint(uniqueNotifString, false, resFp);
          })
            .then((notification_fp) => {
              let bundleData = {
                text: requestData.message_text,
                createdAt: new Date(chaineDateUTC),
                user: {
                  _id: Math.round(new Date().getTime()),
                  name: "TaxiConnect",
                  avatar:
                    "https://ads-central-tc.s3.us-west-1.amazonaws.com/logo_ios.png",
                },
                notification_family: requestData.notification_type,
                isWelcome_message: false,
                date_sent: new Date(chaineDateUTC),
                sender_fp: "TAXICONNECT",
                allowed_users_see: false,
                seen_users_log: [],
                notification_fp: notification_fp,
              };
              //! Get the portion of the audience
              new Promise((resGetAudience) => {
                collectionDrivers_profiles
                  .find({})
                  .toArray(function (err, driversData) {
                    if (err) {
                      logger.error(err);
                      resGetAudience(false);
                    }
                    //...
                    if (driversData !== undefined && driversData.length > 0) {
                      //Found some drivers
                      //?Only get the drivers name, taxi_no and fingerprint
                      let filteredData = driversData.map((driver) => {
                        return {
                          name: driver.name,
                          taxi_number: driver.cars_data[0].taxi_number
                            .toUpperCase()
                            .trim(),
                          driver_fp: driver.driver_fingerprint,
                          push_notification_token:
                            driver.operational_state.push_notification_token !==
                              undefined &&
                            driver.operational_state.push_notification_token !==
                              null &&
                            driver.operational_state.push_notification_token
                              .userId !== undefined &&
                            driver.operational_state.push_notification_token
                              .userId !== null
                              ? driver.operational_state.push_notification_token
                                  .userId
                              : null,
                        };
                      });
                      //...
                      resGetAudience(filteredData);
                    } //No drivers found
                    else {
                      resGetAudience(false);
                    }
                  });
              })
                .then((audience_array) => {
                  //?Save the push notification array
                  let pushNotificationArray = [];

                  if (audience_array !== false) {
                    //Alright
                    //Filter the audience
                    new Promise((resFilterAudience) => {
                      if (/all/i.test(requestData.recipient_type)) {
                        //All drivers
                        audience_array = audience_array.map((driver) => {
                          //...Save the push notification array
                          pushNotificationArray.push(
                            driver.push_notification_token
                          );
                          //...
                          return driver.driver_fp;
                        });
                        //...
                        resFilterAudience(audience_array);
                      } //Specific
                      else {
                        let tmpEndData = [];
                        audience_array = audience_array.map((driverBulk) => {
                          requestData.selected_drivers.map((driverSpeci) => {
                            if (
                              driverBulk.taxi_number.trim().toUpperCase() ===
                              driverSpeci.trim().toUpperCase()
                            ) {
                              //...Save the push notification array
                              pushNotificationArray.push(
                                driverBulk.push_notification_token
                              );
                              //...
                              tmpEndData.push(driverBulk.driver_fp);
                            }
                          });
                        });
                        //...
                        resFilterAudience(tmpEndData);
                      }
                    })
                      .then((finalAudience) => {
                        //?Update the allowed drivers to see
                        bundleData.allowed_users_see = finalAudience;
                        //! Save now
                        collectionNotificationsComm_central.insertOne(
                          bundleData,
                          function (err, reslt) {
                            if (err) {
                              logger.error(err);
                              resolve({ response: "error_processing" });
                            }
                            //...
                            if (requestData.shouldNotifyBy_pushNotif) {
                              //Notify by push notifications
                              new Promise((resNotify) => {
                                //Send the push notifications
                                let message = {
                                  app_id: process.env.DRIVERS_APP_ID_ONESIGNAL,
                                  android_channel_id:
                                    process.env
                                      .DRIVERS_ONESIGNAL_CHANNEL_NEW_NOTIFICATION, //Ride - Auto-cancelled group
                                  priority: 10,
                                  contents: {
                                    en: "You have a new notification that requires your attention, please click here and open on the Notifications tab.",
                                  },
                                  headings: { en: "New notification" },
                                  content_available: true,
                                  include_player_ids: pushNotificationArray,
                                };
                                sendPushUPNotification(message);
                                resNotify(true);
                              })
                                .then()
                                .catch();
                            }
                            //...
                            resolve({ response: "dispatch_successful" });
                          }
                        );
                      })
                      .catch((error) => {
                        logger.error(error);
                        logger.warn(
                          "Could not get the audience - final filter"
                        );
                        resolve({ response: "error_audience_get_failed" });
                      });
                  } //Some error occured
                  else {
                    resolve({ response: "error_audience_get_failed" });
                  }
                })
                .catch((error) => {
                  logger.error(error);
                  logger.warn("Could not get the audience");
                  resolve({ response: "error_audience_get_failed" });
                });
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error_broadcasting" });
            });
        } //Unknown admin
        else {
          resolve({ response: "error_adm_u" });
        }
      });
  } //Invalid data received
  else {
    logger.warn("Invalid admin fp received");
    resolve({ response: "error" });
  }
}

/**
 * @func handleCommissionPageOps
 * Responsible for handling all the driver commission page ops
 * @param requestData: will contain all the operations related data
 * @param resolve
 */

function handleCommissionPageOps(requestData, resolve) {
  if (requestData.op === "getOverallData") {
    let redisKey = "overallCommissionData_admininstration";
    redisGet(redisKey)
      .then((resp) => {
        if (resp !== null) {
          //Found some cached data
          try {
            //Rehydrate the data
            new Promise((resCompute) => {
              execHandleCommissionPageOps(requestData, redisKey, resCompute);
            })
              .then()
              .catch((error) => {
                logger.error(error);
              });
            //...
            resp = JSON.parse(resp);
            //Return quickly
            resolve(resp);
          } catch (error) {
            new Promise((resCompute) => {
              execHandleCommissionPageOps(requestData, redisKey, resCompute);
            })
              .then((result) => {
                resolve(result);
              })
              .catch((error) => {
                logger.error(error);
                resolve({ response: "error" });
              });
          }
        } //Get fresh data
        else {
          new Promise((resCompute) => {
            execHandleCommissionPageOps(requestData, redisKey, resCompute);
          })
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error" });
            });
        }
      })
      .catch((error) => {
        logger.error(error);
        resolve({ response: "error" });
      });
  } else if (
    requestData.op === "getTargetedData" &&
    requestData.driver_fingerprint !== undefined &&
    requestData.driver_fingerprint !== null
  ) {
    let redisKey = `getTargetedData_driversCommission_admininstration-${requestData.driver_fingerprint}`;
    redisGet(redisKey)
      .then((resp) => {
        if (resp !== null) {
          //Found some cached data
          try {
            //Rehydrate the data
            new Promise((resCompute) => {
              execHandleCommissionPageOps(requestData, redisKey, resCompute);
            })
              .then()
              .catch((error) => {
                logger.error(error);
              });
            //...
            resp = JSON.parse(resp);
            //Return quickly
            resolve(resp);
          } catch (error) {
            new Promise((resCompute) => {
              execHandleCommissionPageOps(requestData, redisKey, resCompute);
            })
              .then((result) => {
                resolve(result);
              })
              .catch((error) => {
                logger.error(error);
                resolve({ response: "error" });
              });
          }
        } //Get fresh data
        else {
          new Promise((resCompute) => {
            execHandleCommissionPageOps(requestData, redisKey, resCompute);
          })
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error" });
            });
        }
      })
      .catch((error) => {
        logger.error(error);
        resolve({ response: "error" });
      });
  }
  //Invalid op
  else {
    resolve({ response: "error_invalid_op" });
  }
}

/**
 * @func getDateOfISOWeek
 * Compute the date from the week number and year
 * @param w: week number
 * @param y: year number
 */
function getDateOfISOWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

/**
 * @func execHandleCommissionPageOps
 * Responsible for actively handling all the driver commission page ops
 * @param requestData: will contain all the operations related data
 * @param redisKey: the redis key to cache the specific result of the op to.
 * @param resolve
 */

function execHandleCommissionPageOps(requestData, redisKey, resolve) {
  resolveDate();

  if (requestData.op === "getOverallData") {
    //Get all the drivers
    collectionDrivers_profiles.find({}).toArray(function (err, driversData) {
      if (err) {
        logger.error(err);
        resolve({ response: "error" });
      }
      //...
      if (driversData !== undefined && driversData.length > 0) {
        logger.info(driversData.driver_fingerprint);
        //Found some drivers data
        let RETURN_DATA_MODEL = {
          header: {
            total_commission: 0,
            total_wallet_due: 0,
            average_daily_income: 0,
            currency: "NAD",
            last_date_update: new Date(chaineDateUTC),
          },
          driversData: [],
        };
        //...
        //? Get all the drivers wallet data nad pack them
        let parentPromises = driversData.map((driver, index) => {
          return new Promise((resCompute) => {
            axios
              .get(
                `${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=${driver.driver_fingerprint}`
              )
              .then((tmpDriverWalletData) => {
                tmpDriverWalletData = tmpDriverWalletData.data;
                // logger.info(tmpDriverWalletData.header);
                //Update the header data
                RETURN_DATA_MODEL.header.total_commission +=
                  tmpDriverWalletData.header.remaining_commission !==
                    undefined &&
                  tmpDriverWalletData.header.remaining_commission !== null
                    ? tmpDriverWalletData.header.remaining_commission
                    : 0;
                RETURN_DATA_MODEL.header.total_wallet_due +=
                  tmpDriverWalletData.header.remaining_due_to_driver !==
                    undefined &&
                  tmpDriverWalletData.header.remaining_due_to_driver !== null
                    ? tmpDriverWalletData.header.remaining_due_to_driver
                    : 0;
                //Save the driver record
                //?Enrich the record with the driver details
                tmpDriverWalletData.header["id"] = index + 1;
                tmpDriverWalletData.header["driver_infos"] = {
                  name: driver.name,
                  surname: driver.surname,
                  phone: driver.phone_number,
                  taxi_number: driver.cars_data[0].taxi_number,
                  driver_fp: driver.driver_fingerprint,
                  is_suspended: driver.isDriverSuspended,
                };
                //? Add the average daily income for only the days where he worked
                tmpDriverWalletData.header["total_trips"] = 0;
                tmpDriverWalletData.header["average_daily_income"] = 0;
                collectionRidesDeliveryData
                  .find({ taxi_id: driver.driver_fingerprint })
                  .toArray(function (err, rideInfos) {
                    if (err) {
                      logger.error(err);
                      resCompute(false);
                    }
                    //...
                    if (rideInfos !== undefined && rideInfos.length > 0) {
                      //Has some rides
                      tmpDriverWalletData.header["total_trips"] =
                        rideInfos.length;
                      rideInfos.map((data) => {
                        tmpDriverWalletData.header["average_daily_income"] +=
                          parseFloat(data["fare"]);
                      });

                      //! Consider all the cancelled rides
                      collectionRidesDeliveryDataCancelled
                        .find({ taxi_id: driver.driver_fingerprint })
                        .toArray(function (err, rideInfos) {
                          if (err) {
                            logger.error(err);
                            resCompute(false);
                          }
                          //...
                          if (rideInfos !== undefined && rideInfos.length > 0) {
                            //Has some rides
                            rideInfos.map((data) => {
                              tmpDriverWalletData.header[
                                "average_daily_income"
                              ] += parseFloat(data["fare"]);
                            });

                            //..
                            tmpDriverWalletData.header[
                              "average_daily_income"
                            ] /= tmpDriverWalletData.header["total_trips"];
                            tmpDriverWalletData.header[
                              "average_daily_income"
                            ] *= 10;
                            //? DONE
                            RETURN_DATA_MODEL.driversData.push(
                              tmpDriverWalletData.header
                            );
                            //? Compute the general daily income
                            let indexCount = 0;
                            let total_avg = 0;
                            RETURN_DATA_MODEL.driversData.map((ifo) => {
                              if (ifo["average_daily_income"] > 100) {
                                //Consider
                                total_avg += parseFloat(
                                  ifo["average_daily_income"]
                                );
                                indexCount += 1;
                              }
                            });
                            //..Get the average
                            RETURN_DATA_MODEL.header.average_daily_income =
                              total_avg / indexCount;
                            logger.info(tmpDriverWalletData.header);
                            //...
                            resCompute(true);
                          } //No cancelled rides
                          else {
                            //..
                            tmpDriverWalletData.header[
                              "average_daily_income"
                            ] /= tmpDriverWalletData.header["total_trips"];
                            tmpDriverWalletData.header[
                              "average_daily_income"
                            ] *= 10;
                            //? DONE
                            RETURN_DATA_MODEL.driversData.push(
                              tmpDriverWalletData.header
                            );
                            //...
                            //? Compute the general daily income
                            let indexCount = 0;
                            let total_avg = 0;
                            RETURN_DATA_MODEL.driversData.map((ifo) => {
                              if (ifo["average_daily_income"] > 100) {
                                //Consider
                                total_avg += parseFloat(
                                  ifo["average_daily_income"]
                                );
                                indexCount += 1;
                              }
                            });
                            //..Get the average
                            RETURN_DATA_MODEL.header.average_daily_income =
                              total_avg / indexCount;
                            logger.info(tmpDriverWalletData.header);
                            //...
                            resCompute(true);
                          }
                        });
                    } //No rides
                    else {
                      //...
                      RETURN_DATA_MODEL.driversData.push(
                        tmpDriverWalletData.header
                      );
                      //...
                      resCompute(true);
                    }
                  });
              })
              .catch((error) => {
                logger.info(error);
                resCompute(false);
              });
          });
        });
        //...
        Promise.all(parentPromises)
          .then((result) => {
            logger.warn(result);
            let finalResponse = {
              response: RETURN_DATA_MODEL,
            };
            //!Cache the result
            new Promise((resCache) => {
              redisCluster.setex(
                redisKey,
                parseInt(process.env.REDIS_EXPIRATION_5MIN) * 1440,
                JSON.stringify(finalResponse)
              );
              resCache(true);
            })
              .then()
              .catch();
            //...
            resolve(finalResponse);
          })
          .catch((error) => {
            logger.error(error);
            resolve({ response: "error" });
          });
      } //No drivers
      else {
        resolve({ response: "no_driver_data" });
      }
    });
  } else if (
    requestData.op === "getTargetedData" &&
    requestData.driver_fingerprint !== undefined &&
    requestData.driver_fingerprint !== null
  ) {
    //Get all the drivers
    collectionDrivers_profiles
      .find({
        driver_fingerprint: requestData.driver_fingerprint,
      })
      .toArray(function (err, driversData) {
        if (err) {
          logger.error(err);
          resolve({ response: "error" });
        }
        //...
        if (driversData !== undefined && driversData.length > 0) {
          logger.info(driversData.driver_fingerprint);
          //Found some drivers data
          let RETURN_DATA_MODEL = {
            header: {
              total_commission: 0,
              total_wallet_due: 0,
              currency: "NAD",
              last_date_update: new Date(chaineDateUTC),
            },
            driversData: [],
            transactionData: null,
            graphReadyData: {
              daily_view: {
                earnings_related: {}, //{week_no: [{x:earning, y:monday}]}
                requests_related: {},
              }, //?DONE
              weekly_view: {
                earnings_related: {}, //[{x:week_no, y:earning}]
                requests_related: {},
              }, //?DONE
              montly_view: {
                earnings_related: {}, //{month_no: [{x:month_no, y:earning}]}
                requests_related: {},
              }, //?DONE
              yearly_view: {
                earnings_related: {}, //[{x:year_no, y:earning}]
                requests_related: {},
              }, //?DONE
            },
          };
          //...
          //? Get all the drivers wallet data nad pack them
          let parentPromises = driversData.map((driver, index) => {
            return new Promise((resCompute) => {
              axios
                .get(
                  `${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=${driver.driver_fingerprint}`
                )
                .then((tmpDriverWalletData) => {
                  tmpDriverWalletData = tmpDriverWalletData.data;
                  //Update the header data
                  RETURN_DATA_MODEL.header.total_commission +=
                    tmpDriverWalletData.header.remaining_commission !==
                      undefined &&
                    tmpDriverWalletData.header.remaining_commission !== null
                      ? tmpDriverWalletData.header.remaining_commission
                      : 0;
                  RETURN_DATA_MODEL.header.total_wallet_due +=
                    tmpDriverWalletData.header.remaining_due_to_driver !==
                      undefined &&
                    tmpDriverWalletData.header.remaining_due_to_driver !== null
                      ? tmpDriverWalletData.header.remaining_due_to_driver
                      : 0;
                  //Save the driver record
                  //?Enrich the record with the driver details
                  tmpDriverWalletData.header["id"] = index + 1;
                  tmpDriverWalletData.header["driver_infos"] = {
                    name: driver.name,
                    surname: driver.surname,
                    phone: driver.phone_number,
                    taxi_number: driver.cars_data[0].taxi_number,
                    profile_pic: `${process.env.AWS_S3_DRIVERS_PROFILE_PICTURES_PATH}/${driver.identification_data.profile_picture}`,
                  };
                  //...
                  RETURN_DATA_MODEL.driversData.push(
                    tmpDriverWalletData.header
                  );
                  //?Save transactions week
                  RETURN_DATA_MODEL.transactionData =
                    tmpDriverWalletData.weeks_view;
                  //...
                  resCompute(true);
                })
                .catch((error) => {
                  logger.info(error);
                  resCompute(false);
                });
            });
          });
          //...
          Promise.all(parentPromises)
            .then((result) => {
              logger.warn(result);

              //? Generate graph ready data
              RETURN_DATA_MODEL.transactionData.map((dataPoint) => {
                let dateReference = getDateOfISOWeek(
                  dataPoint.week_number,
                  dataPoint.year_number
                );

                //? 1. Get daily view data
                RETURN_DATA_MODEL.graphReadyData.daily_view.earnings_related[
                  `${dataPoint.week_number}-${dataPoint.year_number}`
                ] =
                  RETURN_DATA_MODEL.graphReadyData.daily_view.earnings_related[
                    `${dataPoint.week_number}-${dataPoint.year_number}`
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.daily_view
                        .earnings_related[
                        `${dataPoint.week_number}-${dataPoint.year_number}`
                      ]
                    : [];
                RETURN_DATA_MODEL.graphReadyData.daily_view.requests_related[
                  `${dataPoint.week_number}-${dataPoint.year_number}`
                ] =
                  RETURN_DATA_MODEL.graphReadyData.daily_view.requests_related[
                    `${dataPoint.week_number}-${dataPoint.year_number}`
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.daily_view
                        .requests_related[
                        `${dataPoint.week_number}-${dataPoint.year_number}`
                      ]
                    : [];
                //prepare the data
                //Earning and requests
                for (var key in dataPoint.daily_earning) {
                  let tmpDailyDataPointEarning = {
                    y: dataPoint.daily_earning[key].earning,
                    x: key,
                  };
                  //...
                  let tmpDailyDataPointRequests = {
                    y: dataPoint.daily_earning[key].requests,
                    x: key,
                  };
                  //...Earning
                  RETURN_DATA_MODEL.graphReadyData.daily_view.earnings_related[
                    `${dataPoint.week_number}-${dataPoint.year_number}`
                  ].push(tmpDailyDataPointEarning);
                  //...Requests
                  RETURN_DATA_MODEL.graphReadyData.daily_view.requests_related[
                    `${dataPoint.week_number}-${dataPoint.year_number}`
                  ].push(tmpDailyDataPointRequests);
                }

                //? 2. Get weekly view data
                RETURN_DATA_MODEL.graphReadyData.weekly_view.earnings_related[
                  dateReference.getFullYear()
                ] =
                  RETURN_DATA_MODEL.graphReadyData.weekly_view.earnings_related[
                    dateReference.getFullYear()
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.weekly_view
                        .earnings_related[dateReference.getFullYear()]
                    : [];
                RETURN_DATA_MODEL.graphReadyData.weekly_view.requests_related[
                  dateReference.getFullYear()
                ] =
                  RETURN_DATA_MODEL.graphReadyData.weekly_view.requests_related[
                    dateReference.getFullYear()
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.weekly_view
                        .requests_related[dateReference.getFullYear()]
                    : [];
                //...
                let tmpEarning = {
                  x: dataPoint.week_number,
                  y: dataPoint.total_earning,
                };
                //.
                let tmpRequests = {
                  x: dataPoint.week_number,
                  y:
                    parseInt(dataPoint.total_rides) +
                    parseInt(dataPoint.total_deliveries),
                };
                //...Save
                //Earning
                RETURN_DATA_MODEL.graphReadyData.weekly_view.earnings_related[
                  dateReference.getFullYear()
                ].push(tmpEarning);
                //Requests
                RETURN_DATA_MODEL.graphReadyData.weekly_view.requests_related[
                  dateReference.getFullYear()
                ].push(tmpRequests);

                //? 3. Get monthly view data
                //..
                RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related[
                  `${
                    dateReference.getMonth() + 1
                  }-${dateReference.getFullYear()}`
                ] =
                  RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related[
                    `${
                      dateReference.getMonth() + 1
                    }-${dateReference.getFullYear()}`
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.montly_view
                        .earnings_related[
                        `${
                          dateReference.getMonth() + 1
                        }-${dateReference.getFullYear()}`
                      ]
                    : [];
                RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related[
                  `${
                    dateReference.getMonth() + 1
                  }-${dateReference.getFullYear()}`
                ] =
                  RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related[
                    `${
                      dateReference.getMonth() + 1
                    }-${dateReference.getFullYear()}`
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.montly_view
                        .requests_related[
                        `${
                          dateReference.getMonth() + 1
                        }-${dateReference.getFullYear()}`
                      ]
                    : [];
                //...
                tmpEarning = {
                  x: dateReference.getMonth() + 1,
                  y: dataPoint.total_earning,
                };
                //.
                tmpRequests = {
                  x: dateReference.getMonth() + 1,
                  y:
                    parseInt(dataPoint.total_rides) +
                    parseInt(dataPoint.total_deliveries),
                };
                //...Save
                //Earning
                RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related[
                  `${
                    dateReference.getMonth() + 1
                  }-${dateReference.getFullYear()}`
                ].push(tmpEarning);
                //Requests
                RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related[
                  `${
                    dateReference.getMonth() + 1
                  }-${dateReference.getFullYear()}`
                ].push(tmpRequests);

                //? 4. Get yearly view data
                //..
                RETURN_DATA_MODEL.graphReadyData.yearly_view.earnings_related[
                  dateReference.getFullYear()
                ] =
                  RETURN_DATA_MODEL.graphReadyData.yearly_view.earnings_related[
                    dateReference.getFullYear()
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.yearly_view
                        .earnings_related[dateReference.getFullYear()]
                    : [];
                RETURN_DATA_MODEL.graphReadyData.yearly_view.requests_related[
                  dateReference.getFullYear()
                ] =
                  RETURN_DATA_MODEL.graphReadyData.yearly_view.requests_related[
                    dateReference.getFullYear()
                  ] !== undefined
                    ? RETURN_DATA_MODEL.graphReadyData.yearly_view
                        .requests_related[dateReference.getFullYear()]
                    : [];
                //...
                tmpEarning = {
                  x: dateReference.getFullYear(),
                  y: dataPoint.total_earning,
                };
                //.
                tmpRequests = {
                  x: dateReference.getFullYear(),
                  y:
                    parseInt(dataPoint.total_rides) +
                    parseInt(dataPoint.total_deliveries),
                };
                //...Save
                //Earning
                RETURN_DATA_MODEL.graphReadyData.yearly_view.earnings_related[
                  dateReference.getFullYear()
                ].push(tmpEarning);
                //Requests
                RETURN_DATA_MODEL.graphReadyData.yearly_view.requests_related[
                  dateReference.getFullYear()
                ].push(tmpRequests);
              });

              //?Reduce monthly to single - earning
              let tmpReducedHolder = {};
              for (var key in RETURN_DATA_MODEL.graphReadyData.montly_view
                .earnings_related) {
                tmpReducedHolder[key.split("-")[1]] =
                  tmpReducedHolder[key.split("-")[1]] !== undefined
                    ? tmpReducedHolder[key.split("-")[1]]
                    : [];
                //...
                tmpReducedHolder[key.split("-")[1]].push({
                  x: parseInt(key),
                  y: RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related[
                    key
                  ].reduce((accumulator, curr) => accumulator + curr.y, 0),
                });
              }
              //Overwrite the prev month data
              RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related =
                tmpReducedHolder;

              //?Reduce monthly to single - requests
              tmpReducedHolder = {};
              for (var key in RETURN_DATA_MODEL.graphReadyData.montly_view
                .requests_related) {
                tmpReducedHolder[key.split("-")[1]] =
                  tmpReducedHolder[key.split("-")[1]] !== undefined
                    ? tmpReducedHolder[key.split("-")[1]]
                    : [];
                //...
                tmpReducedHolder[key.split("-")[1]].push({
                  x: parseInt(key),
                  y: RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related[
                    key
                  ].reduce((accumulator, curr) => accumulator + curr.y, 0),
                });
              }
              //Overwrite the prev month data
              RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related =
                tmpReducedHolder;

              // //?Reduce yearly to single - earning
              tmpReducedHolder = {};
              for (var key in RETURN_DATA_MODEL.graphReadyData.yearly_view
                .earnings_related) {
                tmpReducedHolder[key] =
                  tmpReducedHolder[key] !== undefined
                    ? tmpReducedHolder[key]
                    : [];
                //...
                tmpReducedHolder[key].push({
                  x: parseInt(key),
                  y: RETURN_DATA_MODEL.graphReadyData.yearly_view.earnings_related[
                    key
                  ].reduce((accumulator, curr) => accumulator + curr.y, 0),
                });
              }
              //Overwrite the prev month data
              RETURN_DATA_MODEL.graphReadyData.yearly_view.earnings_related =
                tmpReducedHolder;

              // //?Reduce yearly to single - requests
              tmpReducedHolder = {};
              for (var key in RETURN_DATA_MODEL.graphReadyData.yearly_view
                .requests_related) {
                tmpReducedHolder[key] =
                  tmpReducedHolder[key] !== undefined
                    ? tmpReducedHolder[key]
                    : [];
                //...
                tmpReducedHolder[key].push({
                  x: parseInt(key),
                  y: RETURN_DATA_MODEL.graphReadyData.yearly_view.requests_related[
                    key
                  ].reduce((accumulator, curr) => accumulator + curr.y, 0),
                });
              }
              //Overwrite the prev month data
              RETURN_DATA_MODEL.graphReadyData.yearly_view.requests_related =
                tmpReducedHolder;

              //? Sort the data
              //1. Weekly data
              //Earning
              for (var key in RETURN_DATA_MODEL.graphReadyData.weekly_view
                .earnings_related) {
                RETURN_DATA_MODEL.graphReadyData.weekly_view.earnings_related[
                  key
                ].sort((a, b) => {
                  return b.x > a.x ? -1 : b.x > a.x ? 1 : 0;
                });
              }
              //Requests
              for (var key in RETURN_DATA_MODEL.graphReadyData.weekly_view
                .requests_related) {
                RETURN_DATA_MODEL.graphReadyData.weekly_view.requests_related[
                  key
                ].sort((a, b) => {
                  return b.x > a.x ? -1 : b.x > a.x ? 1 : 0;
                });
              }
              //1. Monthly data
              //Earning
              for (var key in RETURN_DATA_MODEL.graphReadyData.montly_view
                .earnings_related) {
                RETURN_DATA_MODEL.graphReadyData.montly_view.earnings_related[
                  key
                ].sort((a, b) => {
                  return b.x > a.x ? -1 : b.x > a.x ? 1 : 0;
                });
              }
              //Requests
              for (var key in RETURN_DATA_MODEL.graphReadyData.montly_view
                .requests_related) {
                RETURN_DATA_MODEL.graphReadyData.montly_view.requests_related[
                  key
                ].sort((a, b) => {
                  return b.x > a.x ? -1 : b.x > a.x ? 1 : 0;
                });
              }

              //? Remove unneccessary data
              RETURN_DATA_MODEL.transactionData = undefined;

              //?DONE _ PACK
              let finalResponse = {
                response: RETURN_DATA_MODEL,
              };
              //!Cache the result
              new Promise((resCache) => {
                redisCluster.setex(
                  redisKey,
                  parseInt(process.env.REDIS_EXPIRATION_5MIN) * 1440,
                  JSON.stringify(finalResponse)
                );
                resCache(true);
              })
                .then()
                .catch();
              //...
              resolve(finalResponse);
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error" });
            });
        } //No drivers
        else {
          resolve({ response: "no_driver_data" });
        }
      });
  }
  //Invalid op
  else {
    resolve({ response: "error_invalid_op" });
  }
}

/**
 * @func settlementDriversAccounts_ops
 * Responsible for handling all the settlement operations for the drivers.
 * @param requestData: will contain the settlement data bundle
 * @param resolve
 */

function settlementDriversAccounts_ops(requestData, resolve) {
  resolveDate();
  //!Check if the driver is authentic
  collectionDrivers_profiles
    .find({
      driver_fingerprint: requestData.driver_fingerprint,
    })
    .toArray(function (err, driverData) {
      if (err) {
        logger.error(err);
        resolve({ response: "error_checking_driver" });
      }
      //...
      if (driverData !== undefined && driverData.length > 0) {
        //Authy driver
        //Parse the bool values
        requestData.shouldClearOutstandingCommission =
          /true/i.test(requestData.shouldClearOutstandingCommission) ||
          requestData.shouldClearOutstandingCommission
            ? true
            : false;
        requestData.shouldClearWallet =
          /true/i.test(requestData.shouldClearWallet) ||
          requestData.shouldClearWallet
            ? true
            : false;
        //...
        let url =
          `${process.env.JERRY_ACCOUNT_SERVICE}` +
          "/getDrivers_walletInfosDeep?user_fingerprint=" +
          requestData.driver_fingerprint;
        //! Make sure that the values within bounds
        requestAPI(url, function (error, response, body) {
          if (error === null) {
            try {
              body = JSON.parse(body);
              //!Check
              if (
                parseFloat(requestData.financialBrief.remaining_commission) <=
                  parseFloat(body.header.remaining_commission) &&
                parseFloat(requestData.financialBrief.wallet_balance) <=
                  parseFloat(body.header.remaining_due_to_driver)
              ) {
                //!WITHIN BOUNDS
                //? CLear completly commission or wallet
                new Promise((resClear) => {
                  if (
                    requestData.shouldClearOutstandingCommission ||
                    requestData.shouldClearWallet
                  ) {
                    //Clear the comission completly
                    let transactionBundle =
                      requestData.shouldClearOutstandingCommission &&
                      requestData.shouldClearWallet === false
                        ? [
                            {
                              transaction_nature: "commissionTCSubtracted",
                              amount: parseFloat(
                                requestData.financialBrief.remaining_commission
                              ),
                              receiver: "TAXICONNECT",
                              recipient_fp: requestData.driver_fingerprint,
                              date_captured: new Date(chaineDateUTC),
                            },
                          ]
                        : requestData.shouldClearOutstandingCommission ==
                            false && requestData.shouldClearWallet
                        ? [
                            {
                              payment_currency: "NAD",
                              transaction_nature: "weeklyPaidDriverAutomatic",
                              user_fingerprint: requestData.driver_fingerprint,
                              amount: requestData.financialBrief.wallet_balance,
                              date_captured: new Date(chaineDateUTC),
                              timestamp: Math.round(
                                new Date(chaineDateUTC).getTime()
                              ),
                            },
                          ]
                        : [
                            {
                              transaction_nature: "commissionTCSubtracted",
                              amount: parseFloat(
                                requestData.financialBrief.remaining_commission
                              ),
                              receiver: "TAXICONNECT",
                              recipient_fp: requestData.driver_fingerprint,
                              date_captured: new Date(chaineDateUTC),
                            },
                            {
                              payment_currency: "NAD",
                              transaction_nature: "weeklyPaidDriverAutomatic",
                              user_fingerprint: requestData.driver_fingerprint,
                              amount: requestData.financialBrief.wallet_balance,
                              date_captured: new Date(chaineDateUTC),
                              timestamp: Math.round(
                                new Date(chaineDateUTC).getTime()
                              ),
                            },
                          ];

                    logger.warn(transactionBundle);
                    //...
                    collectionWallet_transaction_logs.insertMany(
                      transactionBundle,
                      function (err, reslt) {
                        if (err) {
                          logger.error(err);
                          resClear(false);
                        }
                        //...
                        //? DONE
                        resClear(true);
                      }
                    );
                  } else {
                    resClear(false);
                  }
                })
                  .then()
                  .catch((error) => logger.error(error));

                //? For if any amount is statically set
                if (
                  requestData.shouldClearOutstandingCommission === false ||
                  requestData.shouldClearWallet === false
                ) {
                  if (
                    /commissionSettlement/i.test(
                      requestData.settlementOption
                    ) &&
                    requestData.shouldClearOutstandingCommission === false
                  ) {
                    //COMMISSION
                    let transactionBundle = {
                      transaction_nature: "commissionTCSubtracted",
                      amount: parseFloat(requestData.valueSettlement),
                      receiver: "TAXICONNECT",
                      recipient_fp: requestData.driver_fingerprint,
                      date_captured: new Date(chaineDateUTC),
                    };
                    //..
                    collectionWallet_transaction_logs.insertOne(
                      transactionBundle,
                      function (err, reslt) {
                        if (err) {
                          logger.error(err);
                          resolve({ response: "error_updating_account" });
                        }
                        //...
                        //? Update the driver account
                        new Promise((resUpdateFinancial) => {
                          let url =
                            `${process.env.JERRY_ACCOUNT_SERVICE}` +
                            "/getRiders_walletInfos?user_fingerprint=" +
                            requestData.driver_fingerprint +
                            "&userType=driver&avoidCached_data=true";
                          //! Make sure that the values within bounds
                          requestAPI(url, function (error, response, body) {
                            resUpdateFinancial(true);
                          });
                        })
                          .then()
                          .catch();
                        //? DONE
                        resolve({ response: "successfully" });
                      }
                    );
                  } //Wallet settlement
                  else if (
                    /walletSettlement/i.test(requestData.settlementOption) &&
                    requestData.shouldClearWallet === false
                  ) {
                    let transactionBundle = {
                      payment_currency: "NAD",
                      transaction_nature: "weeklyPaidDriverAutomatic",
                      user_fingerprint: requestData.driver_fingerprint,
                      amount: requestData.valueSettlement,
                      date_captured: new Date(chaineDateUTC),
                      timestamp: Math.round(new Date(chaineDateUTC).getTime()),
                    };
                    //..
                    collectionWallet_transaction_logs.insertOne(
                      transactionBundle,
                      function (err, reslt) {
                        if (err) {
                          logger.error(err);
                          resolve({ response: "error_updating_account" });
                        }
                        //...
                        //? Update the driver account
                        new Promise((resUpdateFinancial) => {
                          let url =
                            `${process.env.JERRY_ACCOUNT_SERVICE}` +
                            "/getRiders_walletInfos?user_fingerprint=" +
                            requestData.driver_fingerprint +
                            "&userType=driver&avoidCached_data=true";
                          //! Make sure that the values within bounds
                          requestAPI(url, function (error, response, body) {
                            resUpdateFinancial(true);
                          });
                        })
                          .then()
                          .catch();
                        //? DONE
                        resolve({ response: "successfully" });
                      }
                    );
                  } //Alright solved
                  else {
                    resolve({ response: "successfully" });
                  }
                } //Done successfully
                else {
                  resolve({ response: "successfully" });
                }
              } //Uncoherent data
              else {
                resolve({ response: "error_incoherent_dataRefs" });
              }
            } catch (err) {
              logger.error(err);
              resolve({ response: "error_finding_financials" });
            }
          } //Some error happened
          else {
            console.warn(error);
            resolve({ response: "error_finding_financials" });
          }
        });
      } //Unknown Driver
      else {
        resolve({ response: "error_checking_driver" });
      }
    });
}

var collectionDrivers_profiles = null;
var collectionRidesDeliveryData = null;
var collectionWallet_transaction_logs = null;
var collectionGlobalEvents = null;
var collectionPassengers_profiles = null;
var collectionRidesDeliveryDataCancelled = null;
var collectionRefferalsInformationGlobal = null;
var collectionAdminCentral = null;
var collectionNotificationsComm_central = null;

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
    logger.info("Successful connection to Database");

    const dbMongo = clientMongo.db(process.env.DB_NAME);
    collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
    collectionRidesDeliveryData = dbMongo.collection(
      "rides_deliveries_requests"
    );
    collectionWallet_transaction_logs = dbMongo.collection(
      "wallet_transactions_logs"
    );
    collectionGlobalEvents = dbMongo.collection("global_events");
    collectionPassengers_profiles = dbMongo.collection("passengers_profiles");

    collectionRidesDeliveryDataCancelled = dbMongo.collection(
      "cancelled_rides_deliveries_requests"
    );
    collectionRefferalsInformationGlobal = dbMongo.collection(
      "referrals_information_global"
    );
    collectionAdminCentral = dbMongo.collection("administration_central");
    collectionNotificationsComm_central = dbMongo.collection(
      "notifications_communications_central"
    ); //Hold all the notifications accounts data
    /*
    collectionDrivers_profiles.find({}).toArray()
    .then((result) => {
        driverDataList = result
        logger.info(driverDataList)
    }).catch((error) => {
        logger.info(error)
    }) */

    /**
     * Socket test API
     */

    app.get("/socket-test", (req, res) => {
      logger.info("Socket test API called at driver service ");

      res.json({ success: true, failure: false });
    });

    /**
     * API responsible to return drivers list
     */
    app.get("/driver-data", (req, res) => {
      logger.info("Driver's Data API called");
      let response = res;
      new Promise((res) => {
        getDriversInfo(
          collectionDrivers_profiles,
          collectionRidesDeliveryData,
          res
        );
      })
        .then((result) => {
          let driverDataList = result;

          //logger.info(result)
          response.json(driverDataList);
        })
        .catch((error) => {
          logger.info(error);
          response.json({
            error:
              "something went wrong. Maybe no connection or wrong parameters",
          });
        });
    });

    /**
     * API serving to insert a payment made by a driver/owner given taxi_number,
     */
    app.post("/cash-payment", (req, res) => {
      const query_taxi_number = req.body.taxi_number
        ? { "cars_data.taxi_number": req.body.taxi_number }
        : "";
      const query_paymentNumber = req.body.paymentNumber
        ? { "identification_data.paymentNumber": req.body.paymentNumber }
        : "";
      const received_amount = req.body.amount;

      if (query_taxi_number) {
        new Promise((res) => {
          InsertcashPayment(
            collectionDrivers_profiles,
            collectionWallet_transaction_logs,
            query_taxi_number,
            received_amount,
            res
          );
        })
          .then((result) => {
            // Verify returned object from InsertCashPayment
            if (!result.error) {
              logger.info("-------------DONE-----------------------");
              logger.info(result);
              res.json({ success: "SUCCESSFUL INSERTION" });
            } else {
              res
                .status(500)
                .send({ error: "no match for provided taxi number" });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.status(500).send({ error: "Something went wrong" });
          });
      } else if (query_paymentNumber) {
        new Promise((res) => {
          InsertcashPayment(
            collectionDrivers_profiles,
            collectionWallet_transaction_logs,
            query_paymentNumber,
            received_amount,
            res
          );
        })
          .then((result) => {
            if (!result.error) {
              logger.info("-------------DONE-----------------------");
              logger.info(result);
              res.json({ success: "SUCCESSFUL INSERTION" });
            } else {
              res
                .status(500)
                .send({ error: "no match for provided payment number" });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.status(500).send({ error: "Something went wrong" });
          });
      } else {
        res.status(500).send({ error: "Something went wrong!!" });
      }
    });

    //* Driver Commission payment
    app.post("/driver-commission-payment", (req, res) => {
      logger.info("DRIVER-COMMISSION-PAYMENT API CALLED");

      new Promise((res) => {
        utils.MakePaymentCommissionTCSubtracted(
          collectionWallet_transaction_logs,
          req.body.driver_fingerprint,
          Number(req.body.amount),
          res
        );
      })
        .then((result) => {
          if (result.error) {
            res.status(500).send({
              error:
                "Oops! something went wrong at server driver db function insert level",
            });
          }

          //*update driver cash and send success

          new Promise((updateDriverCash) => {
            axios
              .get(
                `${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=${req.body.driver_fingerprint}&transactionData=true&avoidCached_data=true`
              )
              .then((data) => {
                logger.info(data.data);
              })
              .catch((error) => {
                logger.info(error);
              });
          })
            .then((res) => {
              // Do nothing
            })
            .catch((error) => {
              logger.error(error);
              logger.warn(
                `Failed to update DriverCash @${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=`
              );
            });

          res
            .status(201)
            .send({ success: `Payment inserted of ${req.body.amount}` });
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Oops! something went wrong at server" });
        });
    });

    // Upload Endpoint for driver registration
    app.post("/upload", (req, res) => {
      /*if (req.files === null || req.files === undefined) {
            return res.status(400).json({ msg: 'No file uploaded'})
        }*/

      //logger.info(req.files)
      logger.info(
        "------------------------------------------------------------"
      );
      logger.info(
        "------------------------------------------------------------"
      );
      logger.info(req.body);
      //! Files: (Temporarily removed)
      /*const profile_picture = req.files.profile_picture
        const driver_licence_doc = req.files.driver_licence_doc
        const copy_id_paper = req.files.copy_id_paper
        const copy_white_paper = req.files.copy_white_paper
        const copy_public_permit = req.files.copy_public_permit
        const copy_blue_paper = req.files.copy_blue_paper
        const taxi_picture = req.files.taxi_picture */

      if (req.body.delivery_provider.length === 0) {
        logger.info("No delivery provider");
      } else {
        logger.info("Delivery provider present");
      }

      let fingerprintSource =
        req.body.name + req.body.surname + req.body.personal_id_number;
      let carFingerprintSource =
        req.body.car_brand + req.body.plate_number + req.body.taxi_number;
      // Generate a fingerprint
      let driverFingerprint;
      let car_fingerprint;
      Promise.all([
        new Promise((future) => {
          // Generate a fingerprint of the driver identity
          GenerateFingerprint(fingerprintSource, false, future);
        }),
        new Promise((future) => {
          // Generate fingerprint of the added car
          GenerateFingerprint(carFingerprintSource, false, future);
        }),
        new Promise((future) => {
          // Generate unique payment number
          CreatePaymentNumber(collectionDrivers_profiles, future);
        }),
      ])
        .then((result) => {
          [driverFingerprint, car_fingerprint, paymentNumber] = result;

          // Driver's object to be stored in db
          let driver = {
            name: req.body.name,
            surname: req.body.surname,
            phone_number: req.body.phone_number.replace(/\s/g, ""),
            email: req.body.email,
            password: "12345678",
            operation_clearances: [req.body.operation_clearances],
            // If delivery, set delivery provider:
            delivery_provider:
              req.body.delivery_provider.length > 0
                ? req.body.delivery_provider
                : false,
            identification_data: {
              // Required files:
              profile_picture: "", //driverFingerprint + "-profile_picture" + "."+ req.files.profile_picture.name.split('.') [req.files.profile_picture.name.split('.').length - 1],
              driver_licence_doc: "", //driverFingerprint + "-driver_licence" + "."+ req.files.driver_licence_doc.name.split('.') [req.files.driver_licence_doc.name.split('.').length - 1],
              copy_id_paper: "", //driverFingerprint + "-id_paper" + "."+ req.files.copy_id_paper.name.split('.') [req.files.copy_id_paper.name.split('.').length - 1],
              copy_white_paper: "", //driverFingerprint + "-white_paper" + "."+ req.files.copy_white_paper.name.split('.') [req.files.copy_white_paper.name.split('.').length - 1],
              copy_public_permit: "", //driverFingerprint + "-public_permit" + "."+ req.files.copy_public_permit.name.split('.') [req.files.copy_public_permit.name.split('.').length - 1],
              copy_blue_paper: "", //driverFingerprint + "-blue_paper" + "."+ req.files.copy_blue_paper.name.split('.') [req.files.copy_blue_paper.name.split('.').length - 1],

              blue_paper_expiration: new Date(req.body.blue_paper_expiration),
              driver_licence_expiration: new Date(
                req.body.driver_licence_expiration
              ),
              // Other identification info
              personal_id_number: req.body.personal_id_number,
              title: req.body.title,
              date_updated: windhoekDateTime, //(new Date()).addHours(2),
              // Default upon creation
              isAccount_verified: true,
              // Personal Banking details
              banking_details: {
                owner_name_bank: req.body.owner_name_bank,
                bank_name: req.body.bank_name,
                account_number: req.body.account_number,
                branch_number: req.body.branch_number,
                branch_name: req.body.branch_name,
                account_type: req.body.account_type
                  ? req.body.account_type
                  : "unknown",
              },
              // Payment number
              paymentNumber: paymentNumber,
            },
            date_registered: windhoekDateTime, //(new Date()).addHours(2),
            date_updated: windhoekDateTime, //(new Date()).addHours(2),  // to be changed upon update
            driver_fingerprint: driverFingerprint,

            // When false, the driver shall not have access permission to the Driver's App
            isDriverSuspended: false,
            // Add car's data:
            cars_data: [
              {
                car_brand: req.body.car_brand,
                car_nature: req.body.car_nature,
                permit_number: req.body.permit_number,
                taxi_number: req.body.taxi_number,
                plate_number: req.body.plate_number,
                max_passengers: parseInt(req.body.max_passengers),
                car_fingerprint: car_fingerprint, // =====
                vehicle_type: req.body.vehicle_type,
                category: req.body.category,
                date_registered: windhoekDateTime, //(new Date()).addHours(2),
                date_updated: windhoekDateTime, //(new Date()).addHours(2),
                taxi_picture: "", //driverFingerprint + "-taxi_picture" + "."+ req.files.taxi_picture.name.split('.') [req.files.taxi_picture.name.split('.').length - 1]
              },
            ],
            operational_state: {
              status: "offline",
              last_location: null,
              accepted_requests_infos: null,
              default_selected_car: {
                max_passengers: parseInt(req.body.max_passengers),
                car_fingerprint: car_fingerprint,
                vehicle_type: req.body.vehicle_type,
                date_Selected: windhoekDateTime, // (new Date()).addHours(2)
              },
              push_notification_token: null,
            },
            referral_fingerprint: req.body.referral_fingerprint
              ? req.body.referral_fingerprint
              : null,
          };
          // Insert object into the database
          collectionDrivers_profiles.insertOne(
            driver,
            function (err, response) {
              if (err) {
                logger.info(err);
                res.send({ error: "Something went wrong, wrong params maybe" });
              }

              logger.info(
                "*************   New Driver Registered   ********************"
              );
              res.send({ success: "successful registration" });
            }
          );
        })
        .catch((error) => {
          logger.info(error);
          res.send({ error: "Something went wrong, wrong params maybe" });
        });
    });

    /**
     * *UPDATE BASIC DRIVER INFORMATION
     */

    app.post("/update-driver-info", (req, res) => {
      logger.info("UPDATE DRIVER INFORMATION API CALLED");

      const driverFingerPrint = req.body.driverFingerPrint;
      const old_taxi_number = req.body.old_taxi_number;
      const name = req.body.name;
      const surname = req.body.surname;
      const phone_number = req.body.phone_number;
      const taxi_number = req.body.taxi_number;
      const plate_number = req.body.plate_number;

      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          {
            driver_fingerprint: driverFingerPrint,
            "cars_data.taxi_number": old_taxi_number,
          },
          {
            name: name,
            surname: surname,
            phone_number: phone_number,
            "cars_data.$.taxi_number": taxi_number,
            "cars_data.$.plate_number": plate_number,
            "cars_data.$.date_updated": windhoekDateTime.addHours(2),
            date_updated: windhoekDateTime.addHours(2),
          },
          res
        );
      })
        .then((update_response) => {
          if (update_response.error) {
            res.status(500).send({
              error: "Failed to update driver info data @database level",
            });
          } else if (update_response.success) {
            // return success message
            res.status(201).send({ success: "Driver info updated" });
          }
        })
        .catch((error) => {
          logger.info(error);
          res.status(500).send({
            error: "Failed to update driver info data @database level",
          });
        });
    });

    /**
     * *UPDATE TAXI/VEHICLE PICTURE
     */
    app.post("/upload-taxi-picture", (req, res) => {
      // BUcket location params
      const paperCategory = "taxi_picture";
      const subdirectory = "Taxi_picture";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          {
            driver_fingerprint: req.body.fingerprint,
            "cars_data.taxi_number": req.body.taxi_number,
          },
          {
            "cars_data.$.taxi_picture":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.taxi_picture_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.taxi_picture, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.taxi_picture_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error: "The taxi picture file was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "Taxi picture updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error: "The taxi picture file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Failed to update data @promise level" });
        });
    });

    /**
     * *UPDATE PROFILE PICTURE
     */
    app.post("/update-profile-picture", (req, res) => {
      // BUcket location params
      const paperCategory = "profile_picture";
      const subdirectory = "Profiles_pictures";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.profile_picture":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.profile_picture_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.profile_picture, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.profile_picture_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error: "The taxi picture file was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "Profile picture updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error: "The profile picture file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res.status(500).send({
            error: "Failed to update data @promise level profile picture",
          });
        });
    });

    /**
     * *UPDATE DRIVER LICENCE DOCUMENT
     */
    app.post("/update-driver-licence", (req, res) => {
      // BUcket location params
      const paperCategory = "driver_licence";
      const subdirectory = "Driver_licence";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.driver_licence_doc":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.driver_licence_doc_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.driver_licence, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.driver_licence_doc_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error:
                    "The driver licence document was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "Driver licence updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error:
                  "The driver licence document file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res.status(500).send({
            error: "Failed to update data @promise level driver licence",
          });
        });
    });

    /**
     * *UPDATE ID paper
     */
    app.post("/update-id-paper", (req, res) => {
      // BUcket location params
      const paperCategory = "id_paper";
      const subdirectory = "Id_paper";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.copy_id_paper":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.copy_id_paper_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res.status(500).send({
              error: "Failed to update data @database level (ID paper)",
            });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.copy_id_paper, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.copy_id_paper_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error: "The id paper document was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "ID paper updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error:
                  "The ID paper document file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Failed to update data @promise level ID paper" });
        });
    });

    /**
     * *UPDATE WHITE PAPER
     */
    app.post("/update-white-paper", (req, res) => {
      // BUcket location params
      const paperCategory = "white_paper";
      const subdirectory = "White_paper";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.copy_white_paper":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.copy_white_paper_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.copy_white_paper, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.copy_white_paper_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error:
                    "The white paper document was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "White paper updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error:
                  "The White paper document file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res.status(500).send({
            error: "Failed to update data @promise level White paper",
          });
        });
    });

    /**
     * *UPDATE PUBLIC PERMIT
     */
    app.post("/update-public-permit", (req, res) => {
      // BUcket location params
      const paperCategory = "public_permit";
      const subdirectory = "Public_permit";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.copy_public_permit":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.copy_public_permit_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.copy_public_permit, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.copy_public_permit_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error:
                    "The public permit document was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "Public permit updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error:
                  "The Public permit document file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res.status(500).send({
            error: "Failed to update data @promise level White paper",
          });
        });
    });

    /**
     * *UPDATE BLUE PAPER
     */
    app.post("/update-blue-paper", (req, res) => {
      // BUcket location params
      const paperCategory = "blue_paper";
      const subdirectory = "Blue_paper";

      // MongoDB insert
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: req.body.fingerprint },
          {
            "identification_data.copy_blue_paper":
              `${req.body.fingerprint}-${paperCategory}` +
              req.body.copy_blue_paper_name,
          },
          res
        );
      })
        .then((data) => {
          if (data.error) {
            res
              .status(500)
              .send({ error: "Failed to update data @database level" });
          }

          // File upload to s3
          new Promise((res) => {
            uploadFile(
              new Buffer.from(req.body.copy_blue_paper, "base64"),
              subdirectory,
              req.body.fingerprint,
              paperCategory,
              req.body.copy_blue_paper_name,
              res
            );
          })
            .then((data) => {
              if (data.error) {
                // Do not register driver if error occurs during file upload
                res.status(500).send({
                  error:
                    "The Blue paper document was not uploaded to s3 bucket",
                });
              } else {
                res.status(201).send({ success: "Blue paper updated" });
              }
            })
            .catch((error) => {
              logger.info(error);
              res.status(500).send({
                error:
                  "The Blue paper document file was not uploaded to s3 bucket",
              });
            });
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Failed to update data @promise level Blue paper" });
        });
    });

    app.get("/cancelled-rides-driver", (req, res) => {
      logger.info("cancelled-rides-driver API CALLED");
      new Promise((res) => {
        getCancelledRidesDriverEvent(
          collectionGlobalEvents,
          collectionRidesDeliveryDataCancelled,
          collectionRidesDeliveryData,
          collectionPassengers_profiles,
          collectionDrivers_profiles,
          res
        );
      })
        .then((result) => {
          //logger.info(result)
          if (result.error) {
            res
              .status(500)
              .json({ success: false, error: "Internal server Error" });
          }

          res.status(200).json({ success: true, data: result });
        })
        .catch((error) => {
          logger.info(error);
        });
    });

    /**
     * * SUSPEND DRIVER
     */

    app.post("/suspend-driver", (req, res) => {
      logger.info("SUSPENDING DRIVER ...@suspend driver API");

      const driverFingerPrint = req.body.driverFingerPrint;
      logger.info(`driver fingerprint: ${driverFingerPrint}`);
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: driverFingerPrint },
          {
            isDriverSuspended: true,
          },
          res
        );
      })
        .then((update_response) => {
          if (update_response.error) {
            res.status(500).send({
              error: true,
              message: "Failed to suspend driver @database level",
            });
          } else if (update_response.success) {
            // return success message
            res
              .status(201)
              .send({ success: true, message: "Driver suspended" });
          }
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Failed to suspend driver @database level" });
        });
    });

    app.post("/unsuspend-driver", (req, res) => {
      logger.info("UNSUSPENDING DRIVER ...@unsuspend driver API");

      const driverFingerPrint = req.body.driverFingerPrint;
      logger.info(`driver fingerprint: ${driverFingerPrint}`);
      new Promise((res) => {
        utils.updateEntry(
          collectionDrivers_profiles,
          { driver_fingerprint: driverFingerPrint },
          {
            isDriverSuspended: false,
          },
          res
        );
      })
        .then((update_response) => {
          if (update_response.error) {
            res.status(500).send({
              error: true,
              message: "Failed to unsuspend driver @database level",
            });
          } else if (update_response.success) {
            // return success message
            res
              .status(201)
              .send({ success: true, message: "Driver unsuspended" });
          }
        })
        .catch((error) => {
          logger.info(error);
          res
            .status(500)
            .send({ error: "Failed to unsuspend driver @database level" });
        });
    });

    /**
     * ======================================================================
     *  * REFERRALS PROGRAM RELATED APIs
     * ======================================================================
     */
    app.get("/referrals", (req, res) => {
      logger.info("GETTING REFFERALS API CALLED ");

      new Promise((res) => {
        utils.getReferrals(
          collectionRefferalsInformationGlobal,
          collectionPassengers_profiles,
          collectionDrivers_profiles,
          res
        );
      })
        .then((referrals) => {
          if (!referrals.success) {
            res.status(500).json({ success: false, error: referrals.error });
          }
          res.status(200).json({ success: true, data: referrals.data });
        })
        .catch((error) => {
          logger.error(error.message);
          res.status(500).json({ success: false, error: error.message });
        });
    });

    app.get(
      "/update-referral-paid-status/:referral_fingerprint",
      (req, res) => {
        const referral_fingerprint = req.params.referral_fingerprint;

        new Promise((res) => {
          utils.updateIsReferralPaid(
            collectionRefferalsInformationGlobal,
            referral_fingerprint,
            res
          );
        })
          .then((data) => {
            logger.info(data);
            if (!data.success) {
              res.status(500).json({
                success: false,
                error: "Failed to update referral payment status",
              });
            }
            res.status(200).json({
              success: true,
              message: "Successfully updated referral payment status",
            });
          })
          .catch((error) => {
            logger.error(error.message);
            res.status(500).json({
              success: false,
              error: "< Failed to update referral payment status >",
            });
          });
      }
    );

    app.get(
      "/update-referral-rejection-status/:referral_fingerprint",
      (req, res) => {
        const referral_fingerprint = req.params.referral_fingerprint;

        new Promise((res) => {
          utils.updateIsReferralRejected(
            collectionRefferalsInformationGlobal,
            referral_fingerprint,
            res
          );
        })
          .then((data) => {
            logger.info(data);
            if (!data.success) {
              res.status(500).json({
                success: false,
                error: "Failed to update referral rejection status",
              });
            }
            res.status(200).json({
              success: true,
              message: "Successfully updated referral rejection status",
            });
          })
          .catch((error) => {
            logger.error(error.message);
            res.status(500).json({
              success: false,
              error: "< Failed to update referral rejection status >",
            });
          });
      }
    );

    app.get(
      "/mark-referral-deleted-user-side/:referral_fingerprint",
      (req, res) => {
        logger.info("mark-referral-deleted-user-side API CALLED");

        const referral_fingerprint = req.params.referral_fingerprint;

        new Promise((res) => {
          utils.updateEntry(
            collectionRefferalsInformationGlobal,
            { referral_fingerprint: referral_fingerprint },
            {
              is_official_deleted_user_side: true,
            },
            res
          );
        })
          .then((update_response) => {
            logger.info(update_response);
            if (update_response.error) {
              res.status(500).json({
                success: false,
                error: "Failed to mark referral deleted on user side",
              });
            } else if (update_response.success) {
              // return success message
              res.status(200).json({
                success: true,
                message: "Successfully marked referral as deleted on user side",
              });
            }
          })
          .catch((error) => {
            logger.error(error.message);
            res.status(500).json({
              error: "< Failed to mark referral deleted on user side >",
            });
          });
      }
    );

    app.get("/delete-referral/:referral_fingerprint", (req, res) => {
      logger.info("delete-referral API CALLED");

      const referral_fingerprint = req.params.referral_fingerprint;

      new Promise((res) => {
        utils.deleteEntry(
          collectionRefferalsInformationGlobal,
          { referral_fingerprint: referral_fingerprint },
          res
        );
      })
        .then((delete_response) => {
          logger.info(delete_response);
          if (!delete_response.success) {
            res
              .status(500)
              .json({ success: false, error: "Failed to delete referral" });
          }

          res.status(200).json({
            success: true,
            message: "Successfull deletion of referral",
          });
        })
        .catch((error) => {
          logger.error(error.message);
          res.status(500).json({
            error: "< Failed to mark referral deleted on user side >",
          });
        });
    });

    /**
     * Get drivers general overview data (like total number of drivers, all the taxi numbers, all the drivers fingerprints, etc)
     */
    app.post("/getGeneralDrivers_analytics", function (req, res) {
      new Promise((resolve) => {
        req = req.body;

        if (
          req.admin_fp !== undefined &&
          req.admin_fp !== null &&
          req.op !== undefined &&
          req.op !== null
        ) {
          getGeneralDrivers_analytics(req, resolve);
        } //Error
        else {
          logger.warn("Did not find an admin fingerprint.");
          resolve({ response: "error" });
        }
      })
        .then((result) => {
          res.send(result);
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "error" });
        });
    });

    /**
     * Responsible for broadcasting the notifications to users (in-app especially)
     */
    app.post("/broadCastNotifications_inapp", function (req, res) {
      new Promise((resolve) => {
        req = req.body;

        if (req.admin_fp !== undefined && req.admin_fp !== null) {
          broadcastNotifications(req, resolve);
        } //Error
        else {
          logger.warn("Did not find an admin fingerprint.");
          resolve({ response: "error" });
        }
      })
        .then((result) => {
          res.send(result);
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "error" });
        });
    });

    /**
     * Get the commission page data
     */
    app.post("/handleCommissionPageOps", function (req, res) {
      new Promise((resolve) => {
        req = req.body;
        handleCommissionPageOps(req, resolve);
      })
        .then((result) => {
          //Compute the stateHash
          new Promise((resHash) => {
            generateUniqueFingerprint(
              JSON.stringify(result),
              "sha256",
              resHash
            );
          })
            .then((stateHash) => {
              result["stateHash"] = stateHash;
              //? Sort by remaining commission
              result.response.driversData.sort((a, b) => {
                let aCommission =
                  a.remaining_commission !== undefined
                    ? a.remaining_commission
                    : 0;
                let bCommission =
                  b.remaining_commission !== undefined
                    ? b.remaining_commission
                    : 0;

                return aCommission > bCommission
                  ? -1
                  : bCommission > aCommission
                  ? 1
                  : 0;
              });
              //? ---
              res.send(result);
            })
            .catch((error) => {
              logger.error(error);
              result["stateHash"] = "genericHash";
              res.send(result);
            });
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "error" });
        });
    });

    /**
     * Driver settlement API responsible for handling the settlement.
     */
    app.post("/driverSettlementOpes", function (req, res) {
      new Promise((resolve) => {
        req = req.body;
        settlementDriversAccounts_ops(req, resolve);
      })
        .then((result) => {
          res.send(result);
        })
        .catch((error) => {
          logger.error(error);
          res.send({ response: "error" });
        });
    });
  }
);

app.get("/test", (req, res) => {
  res
    .status(200)
    .json({ hasSucceeded: true, message: " Driver server up and running" });
});

server.listen(PORT, () => {
  logger.info(`Driver server up and running @ port ${PORT} `);
});
