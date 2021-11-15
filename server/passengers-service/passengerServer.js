// require("newrelic");
const path = require("path");
require("dotenv").config({ path: __dirname + "/./../.env" });
const { logger } = require("../LogService");

const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");

const redis = require("redis");
const fs = require("fs");
const certFile = fs.readFileSync(String(process.env.CERT_FILE));
const { promisify, inspect } = require("util");
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
const redisGet = promisify(redisCluster.get).bind(redisCluster);

//! Error handling redis Error
redisCluster.on("error", function (er) {
  console.trace("Passenger server connection to redis ");
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
const server = http.createServer(app);

const uri = process.env.URL_MONGODB;
const dbName = process.env.DB_NAME;
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
app.use(cors());
app.use(helmet());

const PORT = process.env.PASSENGER_ROOT;

// For testing purpose:
app.get("/", (req, res) => {
  res.send("All is good at Passenger server");
});

checkName = (name, str) => {
  var pattern = str
    .split("")
    .map((x) => {
      return `(?=.*${x})`;
    })
    .join("");
  var regex = new RegExp(`${pattern}`, "g");
  return name.match(regex);
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

function similarityCheck_locations_search(
  arrayLocations,
  query,
  natureSearch = "name",
  res
) {
  //The nature search can be: name , surname, gender, phone, email or date signed up
  //logObject(arrayLocations);
  if (arrayLocations.length > 0) {
    arrayLocations = fastFilter(arrayLocations, function (element) {
      let elementSearch = /name/i.test(natureSearch)
        ? element.name
        : /surname/i.test(natureSearch)
        ? element.surname
        : /gender/i.test(natureSearch)
        ? element.gender
        : /email/i.test(natureSearch)
        ? element.email
        : element.date_signed_up;
      //...
      if (elementSearch != undefined && elementSearch != false) {
        return (
          elementSearch.toLowerCase().includes(query.toLowerCase().trim()) ||
          checkName(elementSearch.toLowerCase(), query.toLowerCase())
        );
      } else {
        return false;
      }
    });
    //..
    logger.info(arrayLocations);
    if (arrayLocations.length > 0) {
      res(arrayLocations.sort());
    } //Empty
    else {
      res(false);
    }
  } else {
    res(false);
  }
}

/**
 * @function getPassengersInfo : Collects the passengers details from db, including total trips per user
 * @param requestData: contains the specification of the request
 * @param {return} resolve
 */

function getPassengersInfo(requestData, resolve) {
  if (requestData.lookup === "search") {
    //For search Autocomplete
    let redisKey = `autocomplete-search-${JSON.stringify(requestData)}`;

    redisGet(redisKey)
      .then((resp) => {
        if (resp !== null) {
          //Has some cached data
          try {
            logger.warn("FOUND SOME CACHED DATA");
            //Rehydrate
            new Promise((resCompute) => {
              execGetPassengersInfo(requestData, redisKey, resCompute);
            })
              .then()
              .catch((error) => {
                logger.error(error);
              });
            //...Return quickly
            resp = JSON.parse(resp);
            resolve(resp);
          } catch (error) {
            logger.error(error);
            resolve({ response: "error" });
          }
        } //Do fresh search
        else {
          new Promise((resCompute) => {
            execGetPassengersInfo(requestData, redisKey, resCompute);
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
        //Do some fresh search
        resolve({ response: "error" });
      });
  } else if (requestData.lookup === "summary") {
    //Get the summary information
    let redisKey = "passengers_general_summary_information_admin";
    //...
    redisGet(redisKey).then((resp) => {
      if (resp !== null) {
        //Found some cached data
        try {
          //Rehydrate
          new Promise((resCompute) => {
            execGetPassengersInfo(requestData, redisKey, resCompute);
          })
            .then()
            .catch((error) => {
              logger.error(error);
            });
          //...Return quickly
          resp = JSON.parse(resp);
          resolve(resp);
        } catch (error) {
          logger.error(error);
          resolve({ response: "error" });
        }
      } //Get fresh data
      else {
        new Promise((resCompute) => {
          execGetPassengersInfo(requestData, redisKey, resCompute);
        })
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            logger.error(error);
            resolve({ response: "error" });
          });
      }
    });
  } //Invalid lookup
  else {
    resolve({ response: "invalid_lookup" });
  }
}

/**
 * @func execGetPassengersInfo
 * Responsible for actively getting the passengers infos
 * @param requestData: contains the specification of the request
 * @param redisKey: the key to cache the results
 * @param {return} resolve
 */
function execGetPassengersInfo(requestData, redisKey, resolve) {
  resolveDate();

  if (requestData.lookup === "search") {
    //Get all the passengers
    redisGet(redisKey)
      .then((resp) => {
        if (resp !== null) {
          try {
            //Rehydrate
            new Promise((resCompute) => {
              getPassengersParsed_data(requestData, redisKey, resCompute);
            })
              .then(() => {})
              .catch((error) => {
                logger.error(error);
              });
            //Has some cached data
            // logger.warn(resp);
            resp = JSON.parse(resp);
            resolve(resp);
          } catch (error) {
            logger.error(error);
            resolve({ response: "error_get" });
          }
        } //Get fresh data
        else {
          new Promise((resCompute) => {
            getPassengersParsed_data(requestData, redisKey, resCompute);
          })
            .then((result) => {
              if (
                result.response !== "no_passengers_data" &&
                result.response !== "error_get"
              ) {
                resolve(result);
              } //No data
              else {
                resolve(result);
              }
            })
            .catch((error) => {
              logger.error(error);
              resolve({ response: "error_get" });
            });
        }
      })
      .catch((error) => {
        logger.error(error);
        resolve({ response: "error_get" });
      });
  } else if (requestData.lookup === "summary") {
    let RETURN_DATA_MODEL = {
      total_users: 0, //?Done
      total_male_users: 0, //?Done
      total_female_users: 0, //?Done
      total_unknown_gender_users: 0, //?Done
      total_new_users: 0, //?Done
      users_whove_usedOneAtleast: 0, //?Done
      users_whove_neverUsed: 0, //?Done
      percentage_active_users: 0,
      realtime_users_online: 0,
      realtime_users_offline: 0,
      tn_mobile_network_users: 0, //?Done
      mtc_network_users: 0, //?Done
      other_networks_users: 0, //?Done
    };
    //...
    collectionPassengers_profiles
      .find({})
      .sort({ date_registered: -1 })
      .toArray(function (err, passengersData) {
        if (err) {
          logger.error(err);
          resolve({ response: "error_get" });
        }
        //...
        if (passengersData !== undefined && passengersData.length > 0) {
          //Found some data
          RETURN_DATA_MODEL.total_users = passengersData.length; //Total users
          //...
          let parentPromises = passengersData.map((user) => {
            //Get male and female users
            if (/(male|Male|MALE|M)/.test(user.gender)) {
              //Male users
              RETURN_DATA_MODEL.total_male_users += 1;
            } else if (/(female|Female|F)/.test(user.gender)) {
              //Female users
              RETURN_DATA_MODEL.total_female_users += 1;
            } //Unknown gender
            else {
              RETURN_DATA_MODEL.total_unknown_gender_users += 1;
            }
            //Get the today's users
            let diff =
              Math.abs(
                new Date(chaineDateUTC) - new Date(user.date_registered)
              ) / 1000;
            diff /= 3600; //In hours
            if (diff < 24) {
              //Registered today
              RETURN_DATA_MODEL.total_new_users += 1;
            }
            //Get the online
            let diffOnOff =
              Math.abs(new Date(chaineDateUTC) - new Date(user.last_updated)) /
              1000;
            diffOnOff /= 60; //In minutes
            if (diffOnOff <= 15) {
              //15min online rule
              RETURN_DATA_MODEL.realtime_users_online += 1;
            } //Offline
            else {
              RETURN_DATA_MODEL.realtime_users_offline += 1;
            }

            //Get the tn mobile, mtc and other networks
            if (/^\+26485/i.test(user.phone_number)) {
              //TN mobile
              RETURN_DATA_MODEL.tn_mobile_network_users += 1;
            } else if (/^\+26481/i.test(user.phone_number)) {
              //MTC
              RETURN_DATA_MODEL.mtc_network_users += 1;
            } //An other network
            else {
              RETURN_DATA_MODEL.other_networks_users += 1;
            }
            //Get the rest of the data
            return new Promise((resCompute) => {
              collectionRidesDeliveryData
                .find({ client_id: user.user_fingerprint })
                .toArray(function (err, tmpTripData) {
                  if (err) {
                    resCompute(false);
                  }
                  //...
                  if (tmpTripData !== undefined && tmpTripData.length > 0) {
                    //Found some rides
                    RETURN_DATA_MODEL.users_whove_usedOneAtleast += 1;
                    resCompute(true);
                  } //No rides - never used
                  else {
                    RETURN_DATA_MODEL.users_whove_neverUsed += 1;
                    resCompute(true);
                  }
                });
            });
          });

          //...
          Promise.all(parentPromises)
            .then((result) => {
              //? Get the percentage active users
              RETURN_DATA_MODEL.percentage_active_users = Math.round(
                (RETURN_DATA_MODEL.users_whove_usedOneAtleast * 100) /
                  RETURN_DATA_MODEL.total_users
              );
              // logger.info(RETURN_DATA_MODEL);
              let finalResponse = {
                response: RETURN_DATA_MODEL,
                lookup: "summary",
              };
              //...
              //Cache the response
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
              resolve({ response: "error_get" });
            });
        } else {
          resolve({ response: "no_data" });
        }
      });
  } else {
    resolve({ response: "invalid_lookup" });
  }
}

/**
 * @func getPassengersParsed_data
 * Responsible for getting the parsed list of passengers data to be used in admin search
 * @param requestData: contains the specification of the request
 * @param redisKey: the key to cache the results
 * @param {return} resolve
 */
function getPassengersParsed_data(requestData, redisKey, resolve) {
  collectionPassengers_profiles
    .find({})
    .sort({ "date_registered.date": -1 })
    .limit(500)
    .toArray(function (err, passengerData) {
      if (err) {
        logger.error(err);
        resolve({ response: "error_get" });
      }
      //...
      if (passengerData !== undefined && passengerData.length > 0) {
        //Found some passengers
        let ARRAY_PASSENGERS_GLOBAL = [];
        passengerData.map((passenger) => {
          let tmpModelRider = {
            name: passenger.name,
            surname: passenger.surname,
            gender: /^F/.test(passenger.gender)
              ? "F"
              : /female/i.test(passenger.gender)
              ? "F"
              : /^M/.test(passenger.gender)
              ? "M"
              : /male/i.test(passenger.gender)
              ? "M"
              : "Unknown",
            phone: passenger.phone_number,
            email: passenger.email,
            profile_pic: `${process.env.AWS_S3_RIDERS_PROFILE_PICTURES_PATH}/${passenger.media.profile_picture}`,
            account_verifications: passenger.account_verifications,
            last_updated: passenger.last_updated,
            date_registered: passenger.date_registered,
          };
          //? SAVE
          ARRAY_PASSENGERS_GLOBAL.push(tmpModelRider);
        });
        //...
        let finalResponse = {
          response: ARRAY_PASSENGERS_GLOBAL,
          lookup: "search",
        };
        //! Cache the data
        new Promise((resCache) => {
          redisCluster.setex(
            redisKey,
            parseInt(process.env.REDIS_EXPIRATION_5MIN) * 1440,
            JSON.stringify(finalResponse)
          );
          resCache(true);
        })
          .then()
          .catch((error) => logger.error(error));
        //...
        resolve(finalResponse);
      } //No passengers
      else {
        resolve({ response: "no_passengers_data" });
      }
    });
}

/**
 *
 * *Returns the cancellled rides from passengers
 * @param {collection} collectionRidesDeliveryDataCancelled
 * @param {collection} collectionPassengers_profiles
 * @param {collection} collectionDrivers_profiles
 * @param {*} resolve
 */

function getCancelledRidesPassenger(requestData, resolve) {
  // Attempt to get data from cache first
  let redisKey = `cancelledRides-riders-datacached-${JSON.stringify(
    requestData
  )}`;

  redisGet(redisKey)
    .then((resp) => {
      if (resp !== null) {
        try {
          logger.warn("Found cached cancelled data");
          //Reehydrate
          new Promise((resCompute) => {
            execGetCancelledRidesPassenger(redisKey, requestData, resCompute);
          })
            .then(() => {})
            .catch(() => {});
          //...
          resp = JSON.parse(resp);
          //...
          resolve(resp);
        } catch (error) {
          logger.error(error);
          new Promise((resCompute) => {
            execGetCancelledRidesPassenger(redisKey, requestData, resCompute);
          })
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              logger.error(error);
              resolve({
                error: "something went wrong @Driver collection",
              });
            });
        }
      } //Get fresh data
      else {
        new Promise((resCompute) => {
          execGetCancelledRidesPassenger(redisKey, requestData, resCompute);
        })
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            logger.error(error);
            resolve({
              error: "something went wrong @Driver collection",
            });
          });
      }
    })
    .catch((error) => {
      logger.error(error);
      resolve({
        error: "something went wrong @Driver collection",
      });
    });
}

function execGetCancelledRidesPassenger(redisKey, requestData, resolve) {
  let basicFilter =
    /All/.test(requestData.reason) === false
      ? {
          ride_mode: "RIDE",
          "pickup_location_infos.state": {
            $in: [requestData.region, `${requestData.region} Region`],
          },
          rider_cancellation_reason: requestData.reason,
        }
      : {
          ride_mode: "RIDE",
          "pickup_location_infos.state": {
            $in: [requestData.region, `${requestData.region} Region`],
          },
        };

  logger.warn(basicFilter);

  collectionRidesDeliveryDataCancelled
    .find(basicFilter)
    .sort({ date_requested: /recentFirst/i.test(requestData.sorting) ? -1 : 1 })
    .limit(200)
    .toArray(function (err, result) {
      // Map through all cancelled ride and return needed info/field
      let allCancelled = result.map((cancelled) => {
        let regionReg = new RegExp(requestData.region, "i");
        if (regionReg.test(cancelled.pickup_location_infos.state) === false) {
          logger.error("FAILED THE TEST");
        }
        return new Promise((response) => {
          // Get the following for each ride
          const date_requested = cancelled.date_requested;
          const date_cancelled = cancelled.date_deleted;
          const carTypeSelected = cancelled.carTypeSelected;
          const passengers_number = cancelled.passengers_number;
          const connect_type = cancelled.connect_type;
          const origin = cancelled.pickup_location_infos.suburb;
          const destination = cancelled.destinationData.map((destination) => {
            return destination.suburb;
          });
          const fare = cancelled.fare;
          const pickupNote =
            cancelled.pickup_location_infos.pickup_note !== "false"
              ? cancelled.pickup_location_infos.pickup_note
              : "None";
          const cancellationReason =
            cancelled.rider_cancellation_reason !== "false"
              ? cancelled.rider_cancellation_reason
              : "None";

          queryPassenger = { user_fingerprint: cancelled.client_id };
          //Get passenger Data
          collectionPassengers_profiles
            .findOne(queryPassenger)
            .then((passenger) => {
              const passenger_name = passenger ? passenger.name : "not found";
              const passenger_surname = passenger
                ? passenger.surname
                : "not found";
              const passenger_gender = passenger
                ? passenger.gender
                : "not found";
              const passenger_phone_number = passenger
                ? passenger.phone_number
                : "not found";
              // Get the driver info in case ride was accepted before cancellation
              if (cancelled.taxi_id) {
                collectionDrivers_profiles
                  .findOne({ driver_fingerprint: cancelled.taxi_id })
                  .then((driver) => {
                    const taxi_number = driver
                      ? driver.cars_data[0]["taxi_number"]
                      : "not found";
                    const driver_name = driver ? driver.name : "not found";
                    const driver_surname = driver
                      ? driver.surname
                      : "not found";

                    //Return the final object
                    response({
                      date_requested,
                      date_cancelled,
                      passengers_number,
                      connect_type,
                      origin,
                      destination,
                      fare,
                      passenger_name,
                      passenger_surname,
                      passenger_gender,
                      passenger_phone_number,
                      taxi_number,
                      driver_name,
                      driver_surname,
                      carTypeSelected,
                      pickupNote,
                      cancellationReason,
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
                  date_cancelled,
                  passengers_number,
                  connect_type,
                  origin,
                  destination,
                  fare,
                  passenger_name,
                  passenger_surname,
                  passenger_gender,
                  passenger_phone_number,
                  taxi_number,
                  driver_name,
                  carTypeSelected,
                  pickupNote,
                  cancellationReason,
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
          redisCluster.setex(
            redisKey,
            parseInt(process.env.REDIS_EXPIRATION_5MIN) * 3,
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
      resolve({ error: "Did not manage to get all promises" });
    });
}

/**
 * * CANCELLED DELIVERIES BY PASSENGER
 */

function getCancelledDeliveries(
  collectionRidesDeliveryDataCancelled,
  collectionPassengers,
  collectionDrivers,
  resolve
) {
  // Attempt to get data from cache first
  redisCluster.get("cancelledDeliveries-cache", (err, reply) => {
    logger.info("looking for data in redis...");

    if (err) {
      logger.info(err);
      // Function to get data directly from Mongo
      collectionRidesDeliveryDataCancelled
        .find({ ride_mode: "DELIVERY" })
        .sort({ date_requested: -1 })
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested;
              const carTypeSelected = cancelled.carTypeSelected;
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
                  if (cancelled.taxi_id) {
                    collectionDrivers_profiles
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
                          carTypeSelected,
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
                      carTypeSelected,
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
              redisCluster.setex(
                "cancelledDeliveries-cache",
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
          collectionRidesDeliveryDataCancelled
            .find({ ride_mode: "DELIVERY" })
            .sort({ date_requested: -1 })
            .limit(100)
            .toArray()
            .then((result) => {
              // Map through all cancelled ride and return needed info/field
              let allCancelled = result.map((cancelled) => {
                return new Promise((response) => {
                  // Get the following for each ride
                  const date_requested = cancelled.date_requested;
                  const carTypeSelected = cancelled.carTypeSelected;
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
                      if (cancelled.taxi_id) {
                        collectionDrivers_profiles
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
                              carTypeSelected,
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
                          carTypeSelected,
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
                  redisCluster.setex(
                    "cancelledDeliveries-cache",
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
        collectionRidesDeliveryDataCancelled
          .find({ ride_mode: "DELIVERY" })
          .sort({ date_requested: -1 })
          .limit(100)
          .toArray()
          .then((result) => {
            // Map through all cancelled ride and return needed info/field
            let allCancelled = result.map((cancelled) => {
              return new Promise((response) => {
                // Get the following for each ride
                const date_requested = cancelled.date_requested;
                const carTypeSelected = cancelled.carTypeSelected;
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
                    if (cancelled.taxi_id) {
                      collectionDrivers_profiles
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
                            carTypeSelected,
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
                        carTypeSelected,
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
                redisCluster.setex(
                  "cancelledDeliveries-cache",
                  600000,
                  JSON.stringify(result),
                  redis.print
                );
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
      collectionRidesDeliveryDataCancelled
        .find({ ride_mode: "DELIVERY" })
        .sort({ date_requested: -1 })
        .limit(100)
        .toArray()
        .then((result) => {
          // Map through all cancelled ride and return needed info/field
          let allCancelled = result.map((cancelled) => {
            return new Promise((response) => {
              // Get the following for each ride
              const date_requested = cancelled.date_requested;
              const carTypeSelected = cancelled.carTypeSelected;
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
                  if (cancelled.taxi_id) {
                    collectionDrivers_profiles
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
                          carTypeSelected,
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
                      carTypeSelected,
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
              redisCluster.setex(
                "cancelledDeliveries-cache",
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

var collectionPassengers_profiles = null;
var collectionDrivers_profiles = null;
var collectionRidesDeliveryData = null;
var collectionRidesDeliveryDataCancelled = null;

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
      logger.info(`Error occured: ${err}`);
    } else {
      logger.info("Successful connection to Database");

      const dbMongo = clientMongo.db(dbName);
      collectionPassengers_profiles = dbMongo.collection("passengers_profiles");
      collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
      collectionRidesDeliveryData = dbMongo.collection(
        "rides_deliveries_requests"
      );
      collectionRidesDeliveryDataCancelled = dbMongo.collection(
        "cancelled_rides_deliveries_requests"
      );
      // Initialize the passenger list variable

      app.post("/getPassengersData", (req, res) => {
        new Promise((resolve) => {
          req = req.body;
          getPassengersInfo(req, resolve);
        })
          .then((result) => {
            // logger.info(result);
            res.send(result);
          })
          .catch((error) => {
            logger.info(error);
            res.json({
              error:
                "something went wrong. Maybe no connection or wrong parameters",
            });
          });
      });

      app.post("/cancelled-ride-passenger", (req, res) => {
        new Promise((res) => {
          getCancelledRidesPassenger(req.body, res);
        })
          .then((data) => {
            if (data.error) {
              res.send({ error: "could not get cancelled rides" });
            } else {
              logger.info("No error, returning cancelled rides by passenger");
              //Compute the stateHash
              new Promise((resHash) => {
                generateUniqueFingerprint(
                  JSON.stringify(data),
                  "sha256",
                  resHash
                );
              })
                .then((stateHash) => {
                  let finalResponse = {
                    stateHash: stateHash,
                    data: data,
                  };
                  //...
                  res.send(finalResponse);
                })
                .catch((error) => {
                  logger.error(error);
                  res.send({ error: "could not get cancelled rides" });
                });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error: true,
              flag: "Error occured @cancelled-ride-passenger API level",
            });
          });
      });

      app.get("/cancelled-deliveries-passenger", (req, res) => {
        new Promise((res) => {
          getCancelledDeliveries(
            collectionRidesDeliveryDataCancelled,
            collectionPassengers_profiles,
            collectionDrivers_profiles,
            res
          );
        })
          .then((data) => {
            if (data.error) {
              res.send({ error: "could not get cancelled deliveries" });
            } else {
              logger.info(
                "No error, returning cancelled deliveries by passenger"
              );
              res.send(data);
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error: true,
              flag: "Error occured @cancelled-deliveries-passenger API level",
            });
          });
      });
    }
  }
);

app.get("/test", (req, res) => {
  res
    .status(200)
    .json({ hasSucceeded: true, message: " Passenger server up and running" });
});

server.listen(PORT, () => {
  logger.info(`Passenger server up and running @ port ${PORT}`);
});
