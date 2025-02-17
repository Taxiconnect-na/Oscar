// require("newrelic");
const path = require("path");
require("dotenv").config({ path: __dirname + "/./../.env" });
const { logger } = require("../LogService");

//* Import my modules
const utils = require("./utils");

const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");

const fs = require("fs");
const certFile = fs.readFileSync(String(process.env.CERT_FILE));

const MongoClient = require("mongodb").MongoClient;

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

//! Error handling redis Error
redisCluster.on("error", function (er) {
  console.trace("Plot server connection to redis failed ");
  logger.error(er.stack);
});

const http = require("http");
/*const https = require("https")
const fs = require("fs")
//Options to be passed to https server
const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "../Encryptions/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../Encryptions/cert.pem"))
}
const server = https.createServer(sslOptions, app) */
const server = http.createServer(app);
//const { promisify } = require("util");
//const getAsync = promisify(client.get).bind(client)

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

const PORT = process.env.PLOT_ROOT;
/*
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}); */

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

//* Check whether object is date or not
var is_date = function (input) {
  if (Object.prototype.toString.call(input) === "[object Date]") return true;
  return false;
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

function GeneralPlottingData(
  collectionRidesDeliveryData,
  collectionRidesDeliveryDataCancelled,
  filteringQuery,
  fire
) {
  logger.info("General plotting data function running");

  redisCluster.get("general-plotting-data", (err, reply) => {
    if (err) {
      logger.info(
        " ERROR OCCURED @REDIS-CLIENT_GET, NO CACHE FOUND, Getting data from DB"
      );
      logger.info(err);
      //*Direct request to database, Then save in redis the output
      collectionRidesDeliveryData
        .find(filteringQuery)
        //.limit(15000)
        .sort({ date_requested: 1 })
        .toArray()
        .then((rides) => {
          // Object containing promise of all final data
          allObjects = rides.map((data) => {
            return new Promise((resolve) => {
              // Store following object to allObjects Array
              resolve({
                year: data.date_requested.getFullYear().toString(),
                month: (data.date_requested.getMonth() + 1).toString(),
                dayNumber: data.date_requested.getDate().toString(),
                dayName: getDayName(data.date_requested.getDay()),
                timeHour: data.date_requested.getHours().toString(),
                monthDay:
                  (data.date_requested.getMonth() + 1).toString() +
                  "-" +
                  data.date_requested.getDate().toString(),
                yearMonth:
                  data.date_requested.getFullYear().toString() +
                  "-" +
                  (data.date_requested.getMonth() + 1).toString(),
                yearMonthDay:
                  data.date_requested.getFullYear().toString() +
                  "-" +
                  (data.date_requested.getMonth() + 1).toString() +
                  "-" +
                  data.date_requested.getDate().toString(),
                fare: Number(data.fare),
                payment_method: data.payment_method,
                connect_type: data.connect_type,
                origin_location_suburb: data.pickup_location_infos.suburb,
                ride_state: "successful",
              });
            }).catch((error) => {
              logger.info(error);
              fire({ error: "Failed to get general plotting data" });
            });
          });
          //Collect all promises and return final array of objects
          Promise.all(allObjects)
            .then((result1) => {
              logger.info(`General plotting data count: ${result1.length}`);
              //logger.info(result1)
              //fire(result)
              collectionRidesDeliveryDataCancelled
                .find({})
                //.limit(10000)
                //.sort({date_requested: -1 })
                .toArray()
                .then((rides0) => {
                  // Object containing promise of all final data
                  allObjectsCancelled = rides0.map((data) => {
                    return new Promise((resolve) => {
                      // Store following object to allObjectsCancelled Array
                      // Make sure the date returned is an object of type date
                      if (is_date(data.date_requested)) {
                        resolve({
                          year: data.date_requested.getFullYear().toString(),
                          month: (
                            data.date_requested.getMonth() + 1
                          ).toString(),
                          dayNumber: data.date_requested.getDate().toString(),
                          dayName: getDayName(data.date_requested.getDay()),
                          timeHour: data.date_requested.getHours().toString(),
                          monthDay:
                            (data.date_requested.getMonth() + 1).toString() +
                            "-" +
                            data.date_requested.getDate().toString(),
                          yearMonth:
                            data.date_requested.getFullYear().toString() +
                            "-" +
                            (data.date_requested.getMonth() + 1).toString(),
                          yearMonthDay:
                            data.date_requested.getFullYear().toString() +
                            "-" +
                            (data.date_requested.getMonth() + 1).toString() +
                            "-" +
                            data.date_requested.getDate().toString(),
                          fare: Number(data.fare),
                          payment_method: data.payment_method,
                          connect_type: data.connect_type,
                          origin_location_suburb:
                            data.pickup_location_infos.suburb,
                          ride_state: "cancelled",
                        });
                      } else {
                        // For Test data that was not in wanted format before live data
                        resolve({
                          year: "2021",
                          month: "1",
                          dayNumber: "3",
                          dayName: "Mon",
                          timeHour: "10",
                          monthDay: "2-13",
                          yearMonth: "2021-1",
                          yearMonthDay: "2021-1-3",
                          fare: Number(data.fare),
                          payment_method: data.payment_method,
                          connect_type: data.connect_type,
                          origin_location_suburb:
                            data.pickup_location_infos.suburb,
                          ride_state: "cancelled",
                        });
                      }
                    }).catch((error) => {
                      logger.info(error);
                      fire({ error: "Failed to get general plotting data" });
                    });
                  });
                  //Collect all promises and return final array of objects
                  Promise.all(allObjectsCancelled)
                    .then((result2) => {
                      logger.info(
                        `General plotting data count cancelled: ${result2.length}`
                      );
                      // logger.info(result2)
                      //* Saving output into redis
                      redisCluster.setex(
                        "general-plotting-data",
                        20000,
                        JSON.stringify(result1.concat(result2)),
                        redis.print
                      );
                      //Return the combination of both lists (cancelled and successful) as ONE LIST
                      fire(result1.concat(result2));
                    })
                    .catch((error) => {
                      logger.info(error);
                      fire({ error: "Failed to get general plotting data" });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  fire({ error: "Failed to get general plotting data" });
                });
            })
            .catch((error) => {
              logger.info(error);
              fire({ error: "Failed to get general plotting data" });
            });
        })
        .catch((error) => {
          logger.info(error);
          fire({ error: "Failed to get general plotting data" });
        });
    } else if (reply) {
      if (reply !== null) {
        logger.info("FOUND GENERAL VISUALIZATION DATA @REDIS");
        logger.info(reply);
        //* Resolve found result
        fire(JSON.parse(reply));

        //*Update result @background in redis from Mongo
        new Promise((background) => {
          //*Direct request to database, Then save in redis the output
          collectionRidesDeliveryData
            .find(filteringQuery)
            //.limit(15000)
            .sort({ date_requested: 1 })
            .toArray()
            .then((rides) => {
              // Object containing promise of all final data
              allObjects = rides.map((data) => {
                return new Promise((resolve) => {
                  //Store following object to allObjects Array
                  resolve({
                    year: data.date_requested.getFullYear().toString(),
                    month: (data.date_requested.getMonth() + 1).toString(),
                    dayNumber: data.date_requested.getDate().toString(),
                    dayName: getDayName(data.date_requested.getDay()),
                    timeHour: data.date_requested.getHours().toString(),
                    monthDay:
                      (data.date_requested.getMonth() + 1).toString() +
                      "-" +
                      data.date_requested.getDate().toString(),
                    yearMonth:
                      data.date_requested.getFullYear().toString() +
                      "-" +
                      (data.date_requested.getMonth() + 1).toString(),
                    yearMonthDay:
                      data.date_requested.getFullYear().toString() +
                      "-" +
                      (data.date_requested.getMonth() + 1).toString() +
                      "-" +
                      data.date_requested.getDate().toString(),
                    fare: Number(data.fare),
                    payment_method: data.payment_method,
                    connect_type: data.connect_type,
                    origin_location_suburb: data.pickup_location_infos.suburb,
                    ride_state: "successful",
                  });
                }).catch((error) => {
                  logger.info(error);
                  fire({ error: "Failed to get general plotting data" });
                });
              });
              //Collect all promises and return final array of objects
              Promise.all(allObjects)
                .then((result1) => {
                  logger.info(`General plotting data count: ${result1.length}`);
                  //logger.info(result1)
                  //fire(result)
                  collectionRidesDeliveryDataCancelled
                    .find({})
                    //.limit(10000)
                    //.sort({date_requested: -1 })
                    .toArray()
                    .then((rides0) => {
                      // Object containing promise of all final data
                      allObjectsCancelled = rides0.map((data) => {
                        return new Promise((resolve) => {
                          // Store following object to allObjectsCancelled Array
                          // Make sure the date returned is an object of type date
                          if (is_date(data.date_requested)) {
                            resolve({
                              year: data.date_requested
                                .getFullYear()
                                .toString(),
                              month: (
                                data.date_requested.getMonth() + 1
                              ).toString(),
                              dayNumber: data.date_requested
                                .getDate()
                                .toString(),
                              dayName: getDayName(data.date_requested.getDay()),
                              timeHour: data.date_requested
                                .getHours()
                                .toString(),
                              monthDay:
                                (
                                  data.date_requested.getMonth() + 1
                                ).toString() +
                                "-" +
                                data.date_requested.getDate().toString(),
                              yearMonth:
                                data.date_requested.getFullYear().toString() +
                                "-" +
                                (data.date_requested.getMonth() + 1).toString(),
                              yearMonthDay:
                                data.date_requested.getFullYear().toString() +
                                "-" +
                                (
                                  data.date_requested.getMonth() + 1
                                ).toString() +
                                "-" +
                                data.date_requested.getDate().toString(),
                              fare: Number(data.fare),
                              payment_method: data.payment_method,
                              connect_type: data.connect_type,
                              origin_location_suburb:
                                data.pickup_location_infos.suburb,
                              ride_state: "cancelled",
                            });
                          } else {
                            // For Test data that was not in wanted format before live data
                            resolve({
                              year: "2021",
                              month: "1",
                              dayNumber: "3",
                              dayName: "Mon",
                              timeHour: "10",
                              monthDay: "2-13",
                              yearMonth: "2021-1",
                              yearMonthDay: "2021-1-3",
                              fare: Number(data.fare),
                              payment_method: data.payment_method,
                              connect_type: data.connect_type,
                              origin_location_suburb:
                                data.pickup_location_infos.suburb,
                              ride_state: "cancelled",
                            });
                          }
                        }).catch((error) => {
                          logger.info(error);
                          fire({
                            error: "Failed to get general plotting data",
                          });
                        });
                      });
                      //Collect all promises and return final array of objects
                      Promise.all(allObjectsCancelled)
                        .then((result2) => {
                          logger.info(
                            `General plotting data count cancelled: ${result2.length}`
                          );
                          // logger.info(result2)
                          //* Saving output into redis
                          redisCluster.setex(
                            "general-plotting-data",
                            20000,
                            JSON.stringify(result1.concat(result2)),
                            redis.print
                          );
                          //Return the combination of both lists (cancelled and successful) as ONE LIST
                          //! No return as cached had been returned fire(result1.concat(result2))
                        })
                        .catch((error) => {
                          logger.info(error);
                          fire({
                            error: "Failed to get general plotting data",
                          });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      fire({ error: "Failed to get general plotting data" });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  fire({ error: "Failed to get general plotting data" });
                });
            })
            .catch((error) => {
              logger.info(error);
              fire({ error: "Failed to get general plotting data" });
            });
        }).catch((error) => {
          logger.info(error);
          fire({
            error:
              "Failed to get general plotting data, error in background redis update",
          });
        });
      } else {
        //* Direct request to Mongo, Then save result
        //*Direct request to database, Then save in redis the output
        logger.info(" NULL REPLY RETURNED FROM REDIS");

        collectionRidesDeliveryData
          .find(filteringQuery)
          //.limit(15000)
          .sort({ date_requested: 1 })
          .toArray()
          .then((rides) => {
            // Object containing promise of all final data
            allObjects = rides.map((data) => {
              return new Promise((resolve) => {
                // Store following object to allObjects Array
                resolve({
                  year: data.date_requested.getFullYear().toString(),
                  month: (data.date_requested.getMonth() + 1).toString(),
                  dayNumber: data.date_requested.getDate().toString(),
                  dayName: getDayName(data.date_requested.getDay()),
                  timeHour: data.date_requested.getHours().toString(),
                  monthDay:
                    (data.date_requested.getMonth() + 1).toString() +
                    "-" +
                    data.date_requested.getDate().toString(),
                  yearMonth:
                    data.date_requested.getFullYear().toString() +
                    "-" +
                    (data.date_requested.getMonth() + 1).toString(),
                  yearMonthDay:
                    data.date_requested.getFullYear().toString() +
                    "-" +
                    (data.date_requested.getMonth() + 1).toString() +
                    "-" +
                    data.date_requested.getDate().toString(),
                  fare: Number(data.fare),
                  payment_method: data.payment_method,
                  connect_type: data.connect_type,
                  origin_location_suburb: data.pickup_location_infos.suburb,
                  ride_state: "successful",
                });
              }).catch((error) => {
                logger.info(error);
                fire({ error: "Failed to get general plotting data" });
              });
            });
            //Collect all promises and return final array of objects
            Promise.all(allObjects)
              .then((result1) => {
                logger.info(`General plotting data count: ${result1.length}`);
                //logger.info(result1)
                //fire(result)
                collectionRidesDeliveryDataCancelled
                  .find({})
                  //.limit(10000)
                  //.sort({date_requested: -1 })
                  .toArray()
                  .then((rides0) => {
                    // Object containing promise of all final data
                    allObjectsCancelled = rides0.map((data) => {
                      return new Promise((resolve) => {
                        // Store following object to allObjectsCancelled Array
                        // Make sure the date returned is an object of type date
                        if (is_date(data.date_requested)) {
                          resolve({
                            year: data.date_requested.getFullYear().toString(),
                            month: (
                              data.date_requested.getMonth() + 1
                            ).toString(),
                            dayNumber: data.date_requested.getDate().toString(),
                            dayName: getDayName(data.date_requested.getDay()),
                            timeHour: data.date_requested.getHours().toString(),
                            monthDay:
                              (data.date_requested.getMonth() + 1).toString() +
                              "-" +
                              data.date_requested.getDate().toString(),
                            yearMonth:
                              data.date_requested.getFullYear().toString() +
                              "-" +
                              (data.date_requested.getMonth() + 1).toString(),
                            yearMonthDay:
                              data.date_requested.getFullYear().toString() +
                              "-" +
                              (data.date_requested.getMonth() + 1).toString() +
                              "-" +
                              data.date_requested.getDate().toString(),
                            fare: Number(data.fare),
                            payment_method: data.payment_method,
                            connect_type: data.connect_type,
                            origin_location_suburb:
                              data.pickup_location_infos.suburb,
                            ride_state: "cancelled",
                          });
                        } else {
                          // For Test data that was not in wanted format before live data
                          resolve({
                            year: "2021",
                            month: "1",
                            dayNumber: "3",
                            dayName: "Mon",
                            timeHour: "10",
                            monthDay: "2-13",
                            yearMonth: "2021-1",
                            yearMonthDay: "2021-1-3",
                            fare: Number(data.fare),
                            payment_method: data.payment_method,
                            connect_type: data.connect_type,
                            origin_location_suburb:
                              data.pickup_location_infos.suburb,
                            ride_state: "cancelled",
                          });
                        }
                      }).catch((error) => {
                        logger.info(error);
                        fire({ error: "Failed to get general plotting data" });
                      });
                    });
                    //Collect all promises and return final array of objects
                    Promise.all(allObjectsCancelled)
                      .then((result2) => {
                        logger.info(
                          `General plotting data count cancelled: ${result2.length}`
                        );
                        // logger.info(result2)
                        //* Saving output into redis
                        redisCluster.setex(
                          "general-plotting-data",
                          20000,
                          JSON.stringify(result1.concat(result2)),
                          redis.print
                        );
                        //Return the combination of both lists (cancelled and successful) as ONE LIST
                        fire(result1.concat(result2));
                      })
                      .catch((error) => {
                        logger.info(error);
                        fire({ error: "Failed to get general plotting data" });
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                    fire({ error: "Failed to get general plotting data" });
                  });
              })
              .catch((error) => {
                logger.info(error);
                fire({ error: "Failed to get general plotting data" });
              });
          })
          .catch((error) => {
            logger.info(error);
            fire({ error: "Failed to get general plotting data" });
          });
      }
    } else {
      //*Direct request to database, Then save in redis the output

      //*Direct request to database, Then save in redis the output
      logger.info(" NO CACHE FOUND AT REDIS");

      collectionRidesDeliveryData
        .find(filteringQuery)
        //.limit(15000)
        .sort({ date_requested: 1 })
        .toArray()
        .then((rides) => {
          // Object containing promise of all final data
          allObjects = rides.map((data) => {
            return new Promise((resolve) => {
              // Store following object to allObjects Array
              resolve({
                year: data.date_requested.getFullYear().toString(),
                month: (data.date_requested.getMonth() + 1).toString(),
                dayNumber: data.date_requested.getDate().toString(),
                dayName: getDayName(data.date_requested.getDay()),
                timeHour: data.date_requested.getHours().toString(),
                monthDay:
                  (data.date_requested.getMonth() + 1).toString() +
                  "-" +
                  data.date_requested.getDate().toString(),
                yearMonth:
                  data.date_requested.getFullYear().toString() +
                  "-" +
                  (data.date_requested.getMonth() + 1).toString(),
                yearMonthDay:
                  data.date_requested.getFullYear().toString() +
                  "-" +
                  (data.date_requested.getMonth() + 1).toString() +
                  "-" +
                  data.date_requested.getDate().toString(),
                fare: Number(data.fare),
                payment_method: data.payment_method,
                connect_type: data.connect_type,
                origin_location_suburb: data.pickup_location_infos.suburb,
                ride_state: "successful",
              });
            }).catch((error) => {
              logger.info(error);
              fire({ error: "Failed to get general plotting data" });
            });
          });
          //Collect all promises and return final array of objects
          Promise.all(allObjects)
            .then((result1) => {
              logger.info(`General plotting data count: ${result1.length}`);
              //logger.info(result1)
              //fire(result)
              collectionRidesDeliveryDataCancelled
                .find({})
                //.limit(10000)
                //.sort({date_requested: -1 })
                .toArray()
                .then((rides0) => {
                  // Object containing promise of all final data
                  allObjectsCancelled = rides0.map((data) => {
                    return new Promise((resolve) => {
                      // Store following object to allObjectsCancelled Array
                      // Make sure the date returned is an object of type date
                      if (is_date(data.date_requested)) {
                        resolve({
                          year: data.date_requested.getFullYear().toString(),
                          month: (
                            data.date_requested.getMonth() + 1
                          ).toString(),
                          dayNumber: data.date_requested.getDate().toString(),
                          dayName: getDayName(data.date_requested.getDay()),
                          timeHour: data.date_requested.getHours().toString(),
                          monthDay:
                            (data.date_requested.getMonth() + 1).toString() +
                            "-" +
                            data.date_requested.getDate().toString(),
                          yearMonth:
                            data.date_requested.getFullYear().toString() +
                            "-" +
                            (data.date_requested.getMonth() + 1).toString(),
                          yearMonthDay:
                            data.date_requested.getFullYear().toString() +
                            "-" +
                            (data.date_requested.getMonth() + 1).toString() +
                            "-" +
                            data.date_requested.getDate().toString(),
                          fare: Number(data.fare),
                          payment_method: data.payment_method,
                          connect_type: data.connect_type,
                          origin_location_suburb:
                            data.pickup_location_infos.suburb,
                          ride_state: "cancelled",
                        });
                      } else {
                        // For Test data that was not in wanted format before live data
                        resolve({
                          year: "2021",
                          month: "1",
                          dayNumber: "3",
                          dayName: "Mon",
                          timeHour: "10",
                          monthDay: "2-13",
                          yearMonth: "2021-1",
                          yearMonthDay: "2021-1-3",
                          fare: Number(data.fare),
                          payment_method: data.payment_method,
                          connect_type: data.connect_type,
                          origin_location_suburb:
                            data.pickup_location_infos.suburb,
                          ride_state: "cancelled",
                        });
                      }
                    }).catch((error) => {
                      logger.info(error);
                      fire({ error: "Failed to get general plotting data" });
                    });
                  });
                  //Collect all promises and return final array of objects
                  Promise.all(allObjectsCancelled)
                    .then((result2) => {
                      logger.info(
                        `General plotting data count cancelled: ${result2.length}`
                      );
                      // logger.info(result2)
                      //* Saving output into redis
                      redisCluster.setex(
                        "general-plotting-data",
                        20000,
                        JSON.stringify(result1.concat(result2)),
                        redis.print
                      );
                      //Return the combination of both lists (cancelled and successful) as ONE LIST
                      fire(result1.concat(result2));
                    })
                    .catch((error) => {
                      logger.info(error);
                      fire({ error: "Failed to get general plotting data" });
                    });
                })
                .catch((error) => {
                  logger.info(error);
                  fire({ error: "Failed to get general plotting data" });
                });
            })
            .catch((error) => {
              logger.info(error);
              fire({ error: "Failed to get general plotting data" });
            });
        })
        .catch((error) => {
          logger.info(error);
          fire({ error: "Failed to get general plotting data" });
        });
    }
  });
}

/**
 * @function MonthlyDataCount: returns monthy counts based on spicified year and grouping criteria ("yearMonth")
 * * //! Empty list is returned whenever the year is not contained in the data
 * @param {array of objects} data: Objects of the array are the ones generated by GeneralPlottingData function
 * @param {string} filteringYear : The year for which the data should be returned
 *
 * @returns
 */
function MonthlyDataCount(dataToGroup, filteringYear, resolve) {
  let sorted = dataToGroup.groupBy("yearMonth");
  //logger.info(sorted)
  let sortedList = sorted.map((category) => {
    //return a promise for each object to be added to the list
    return new Promise((output) => {
      // Group internal groupList by ride_state
      let success_cancelled_group = category.groupList.groupBy("ride_state");
      // Initialise internal data Object
      let internalData = {};
      let internalList = success_cancelled_group.map((internalCategory) => {
        //logger.info(internalCategory)
        return internalCategory;
      });

      let cancelledObjectInternal = internalList.find(
        (each) => each.field === "cancelled"
      );
      let successfulObjectInternal = internalList.find(
        (each) => each.field === "successful"
      );

      if (cancelledObjectInternal) {
        logger.info(`cancelled: ${cancelledObjectInternal.groupList.length}`);
        internalData.cancelled = cancelledObjectInternal.groupList.length;
      } else if (!cancelledObjectInternal) {
        logger.info("no cancelled object here");
        internalData.cancelled = 0;
      }

      if (successfulObjectInternal) {
        logger.info(`successful: ${successfulObjectInternal.groupList.length}`);
        internalData.successful = successfulObjectInternal.groupList.length;
      } else if (!successfulObjectInternal) {
        logger.info("No successful object here");
        internalData.successful = 0;
      }

      output({
        date: category.field,
        successful: internalData.successful,
        cancelled: internalData.cancelled,
      });
    }).catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
  });

  Promise.all(sortedList)
    .then((result) => {
      // return data filtered by wanted year
      let yearFilteredArray = result.filter((element) => {
        return element.date.startsWith(filteringYear);
      });

      resolve(yearFilteredArray);
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
}

/**
 * @function SumFareField: Returns the sum of the fare field of an array of objects
 * @param {Array} object: This should be an array of objects containing a field named fare(A Number)
 * @returns
 */
function SumFareField(object) {
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0); // The sum function
  //Initialize array
  let finalArray = object.map((each) => {
    return each.fare;
  });

  return Sum(finalArray);
}

/**
 * @function SumFareFieldCommission: Returns the sum of the fare field's commision of an array of objects
 * @param {Array} object: This should be an array of objects containing a field named fare(A Number)
 * @param {Number} commissionPercentage
 * @returns
 */
function SumFareFieldCommission(object, commissionPercentage) {
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0); // The sum function
  //Initialize array
  let finalArray = object.map((each) => {
    return (each.fare * commissionPercentage) / 100;
  });

  return Sum(finalArray).toFixed(2);
}

/**
 * @function MonthlyDataFare: returns monthy gross sales based on spicified year and grouping criteria ("yearMonth")
 * * //! Empty list is returned whenever the year is not contained in the data
 * @param {array of objects} dataToGroup: Objects of the array are the ones generated by GeneralPlottingData function
 * @param {string} filteringYear : The year for which the data should be returned
 * @param {string} groupField : The field of the general object to be used for grouping
 *
 * @returns
 */
function MonthlyDataFare(dataToGroup, filteringYear, resolve) {
  let sorted = dataToGroup.groupBy("yearMonth");
  //logger.info(sorted)
  let sortedList = sorted.map((category) => {
    //return a promise for each object to be added to the list
    return new Promise((output) => {
      // Group internal groupList by ride_state
      let success_cancelled_group = category.groupList.groupBy("ride_state");
      // Initialise internal data Object
      let internalData = {};
      let internalList = success_cancelled_group.map((internalCategory) => {
        //logger.info(internalCategory)
        return internalCategory;
      });

      let cancelledObjectInternal = internalList.find(
        (each) => each.field === "cancelled"
      );
      let successfulObjectInternal = internalList.find(
        (each) => each.field === "successful"
      );

      if (cancelledObjectInternal) {
        logger.info(`cancelled: ${cancelledObjectInternal.groupList.length}`);
        internalData.cancelled = SumFareField(
          cancelledObjectInternal.groupList
        );
      } else if (!cancelledObjectInternal) {
        logger.info("no cancelled object here");
        internalData.cancelled = 0;
      }

      if (successfulObjectInternal) {
        logger.info(`successful: ${successfulObjectInternal.groupList.length}`);
        internalData.successful = SumFareField(
          successfulObjectInternal.groupList
        );
      } else if (!successfulObjectInternal) {
        logger.info("No successful object here");
        internalData.successful = 0;
      }

      output({
        date: category.field,
        successful: internalData.successful,
        cancelled: internalData.cancelled,
      });
    }).catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
  });

  Promise.all(sortedList)
    .then((result) => {
      // return data filtered by wanted year
      let yearFilteredArray = result.filter((element) => {
        return element.date.startsWith(filteringYear);
      });

      resolve(yearFilteredArray);
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
}

/**
 * @function MonthlyDataFareCommission: returns gross sales for each month based on spicified year and grouping criteria ("yearMonth")
 * * //! Empty list is returned whenever the year is not contained in the data
 * @param {array of objects} dataToGroup: Objects of the array are the ones generated by GeneralPlottingData function
 * @param {string} filteringYear : The year for which the data should be returned
 *
 * @returns
 */
function MonthlyDataFareCommission(
  dataToGroup,
  filteringYear,
  commissionPercentage,
  resolve
) {
  let sorted = dataToGroup.groupBy("yearMonth");
  //logger.info(sorted)
  let sortedList = sorted.map((category) => {
    //return a promise for each object to be added to the list
    return new Promise((output) => {
      // Group internal groupList by ride_state
      let success_cancelled_group = category.groupList.groupBy("ride_state");
      // Initialise internal data Object
      let internalData = {};
      let internalList = success_cancelled_group.map((internalCategory) => {
        //logger.info(internalCategory)
        return internalCategory;
      });

      let cancelledObjectInternal = internalList.find(
        (each) => each.field === "cancelled"
      );
      let successfulObjectInternal = internalList.find(
        (each) => each.field === "successful"
      );

      if (cancelledObjectInternal) {
        logger.info(`cancelled: ${cancelledObjectInternal.groupList.length}`);
        internalData.cancelled = SumFareFieldCommission(
          cancelledObjectInternal.groupList,
          commissionPercentage
        );
      } else if (!cancelledObjectInternal) {
        logger.info("no cancelled object here");
        internalData.cancelled = 0;
      }

      if (successfulObjectInternal) {
        logger.info(`successful: ${successfulObjectInternal.groupList.length}`);
        internalData.successful = SumFareFieldCommission(
          successfulObjectInternal.groupList,
          commissionPercentage
        );
      } else if (!successfulObjectInternal) {
        logger.info("No successful object here");
        internalData.successful = 0;
      }

      output({
        date: category.field,
        successful: internalData.successful,
        cancelled: internalData.cancelled,
      });
    }).catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
  });

  Promise.all(sortedList)
    .then((result) => {
      // return data filtered by wanted year
      let yearFilteredArray = result.filter((element) => {
        return element.date.startsWith(filteringYear);
      });

      resolve(yearFilteredArray);
    })
    .catch((error) => {
      logger.info(error);
      resolve({ error: "Failed to return the monthly list of data" });
    });
}

//************************ */
//* CONNECT TYPE
//************************ */

function MonthlyDataCountConnectType(dataToGroup, filteringYear, resolve) {
  let sorted = dataToGroup.groupBy("yearMonth");
  //logger.info(sorted)
  let sortedList = sorted.map((category) => {
    //return a promise for each object to be added to the list
    return new Promise((output) => {
      // Group internal groupList by ride_state
      let connect_type_groups = category.groupList.groupBy("connect_type");
      let internalData = {};
      let internalList = connect_type_groups.map((internalCategory) => {
        //logger.info(internalCategory)
        return internalCategory;
      });
      //logger.info(internalList.find((each) => each.field === "cancelled"))
      //logger.info(internalList.find((each) => each.field === "successful"))

      let connectMeObjectInternal = internalList.find(
        (each) => each.field === "ConnectMe"
      );
      let connectUsObjectInternal = internalList.find(
        (each) => each.field === "ConnectUs"
      );

      if (connectMeObjectInternal) {
        logger.info(`connectMe: ${connectMeObjectInternal.groupList.length}`);
        internalData.ConnectMe = connectMeObjectInternal.groupList.length;
      } else if (!connectMeObjectInternal) {
        logger.info("no connectMe object here");
        internalData.ConnectMe = 0;
      }

      if (connectUsObjectInternal) {
        logger.info(`connectUs: ${connectUsObjectInternal.groupList.length}`);
        internalData.ConnectUs = connectUsObjectInternal.groupList.length;
      } else if (!connectUsObjectInternal) {
        logger.info("No successful object @ connect Us");
        internalData.ConnectUs = 0;
      }

      output({
        date: category.field,
        ConnectMe: internalData.ConnectMe,
        ConnectUs: internalData.ConnectUs,
      });
    }).catch((error) => {
      logger.info(error);
      resolve({
        error: "Failed to return the monthly list of data for connect Type",
      });
    });
  });

  Promise.all(sortedList)
    .then((result) => {
      // return data filtered by wanted year
      let yearFilteredArray = result.filter((element) => {
        return element.date.startsWith(filteringYear);
      });

      resolve(yearFilteredArray);
    })
    .catch((error) => {
      logger.info(error);
      resolve({
        error: "Failed to return the monthly list of data for connect Type",
      });
    });
}

//************************************************************************ */
//*                 PAYMENT METHOD
//************************************************************************ */

/**
 *
 * @param {*} dataToGroup
 * @param {*} filteringYear
 * @param {*} resolve
 */

function MonthlyDataCountPaymentMethod(dataToGroup, filteringYear, resolve) {
  let sorted = dataToGroup.groupBy("yearMonth");
  //logger.info(sorted)
  let sortedList = sorted.map((category) => {
    //return a promise for each object to be added to the list
    return new Promise((output) => {
      // Group internal groupList by ride_state
      let payment_method_groups = category.groupList.groupBy("payment_method");
      let internalData = {};
      let internalList = payment_method_groups.map((internalCategory) => {
        //logger.info(internalCategory)
        return internalCategory;
      });
      //logger.info(internalList.find((each) => each.field === "cancelled"))
      //logger.info(internalList.find((each) => each.field === "successful"))

      let CASHObjectInternal = internalList.find(
        (each) => each.field === "CASH"
      );
      let WALLETObjectInternal = internalList.find(
        (each) => each.field === "WALLET"
      );

      if (CASHObjectInternal) {
        logger.info(`connectMe: ${CASHObjectInternal.groupList.length}`);
        internalData.CASH = CASHObjectInternal.groupList.length;
      } else if (!CASHObjectInternal) {
        logger.info("No successful object @ CASH");
        internalData.CASH = 0;
      }

      if (WALLETObjectInternal) {
        logger.info(`Wallet: ${WALLETObjectInternal.groupList.length}`);
        internalData.WALLET = WALLETObjectInternal.groupList.length;
      } else if (!WALLETObjectInternal) {
        logger.info("No successful object @ WALLET");
        internalData.WALLET = 0;
      }

      output({
        date: category.field,
        CASH: internalData.CASH,
        WALLET: internalData.WALLET,
      });
    }).catch((error) => {
      logger.info(error);
      resolve({
        error: "Failed to return the monthly list of data for payment method",
      });
    });
  });

  Promise.all(sortedList)
    .then((result) => {
      // return data filtered by wanted year
      let yearFilteredArray = result.filter((element) => {
        return element.date.startsWith(filteringYear);
      });

      resolve(yearFilteredArray);
    })
    .catch((error) => {
      logger.info(error);
      resolve({
        error: "Failed to return the monthly list of data for PAYMENT METHOD",
      });
    });
}

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
      logger.info("Successful connection to Database @Plot-server");

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

      app.get("/rides-plot-data/per-month-count/:year", (req, res) => {
        logger.info("VISUALIZER API Called");
        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res.send({
                error:
                  "Failed to get rides monthly data @General Data format function level",
              });
            } else {
              new Promise((res) => {
                MonthlyDataCount(result, req.params.year, res);
              }).then((monthly) => {
                logger.info(monthly);
                res.send(monthly);
              });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error:
                "Failed to get rides monthly data, maybe verify your params",
            });
          });
      });

      app.get("/rides-plot-data/per-month-gross-sales/:year", (req, res) => {
        logger.info("VISUALIZER API Called (Gross Sales)");
        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res.send({
                error:
                  "Failed to get rides monthly data @General Data format function level",
              });
            } else {
              new Promise((res) => {
                MonthlyDataFare(result, req.params.year, res);
              })
                .then((monthly) => {
                  logger.info(monthly);
                  res.send(monthly);
                })
                .catch((error) => {
                  logger.info(error);
                  res.send({
                    error:
                      "Failed to get sales monthly data, maybe verify your params",
                  });
                });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error:
                "Failed to get sales monthly data, maybe verify your params",
            });
          });
      });

      app.get("/rides-plot-data/per-month-revenues/:year", (req, res) => {
        logger.info("VISUALIZER API Called (Revenues)");
        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res.send({
                error:
                  "Failed to get rides monthly data @General Data format function level",
              });
            } else {
              new Promise((res) => {
                //! Commission Percentage: 10 %
                MonthlyDataFareCommission(result, req.params.year, 10, res);
              })
                .then((monthly) => {
                  logger.info(monthly);
                  res.send(monthly);
                })
                .catch((error) => {
                  logger.info(error);
                  res.send({
                    error:
                      "Failed to get sales monthly data, maybe verify your params",
                  });
                });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error:
                "Failed to get sales monthly data, maybe verify your params",
            });
          });
      });

      // Monthly Connect type counts ( Successfull and cancelled rides )
      app.get("/rides-plot-data/per-month-connect-type/:year", (req, res) => {
        logger.info("VISUALIZER API Called (Connect Type)");
        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res.send({
                error:
                  "Failed to get rides monthly data @General Data format function level",
              });
            } else {
              new Promise((res) => {
                MonthlyDataCountConnectType(result, req.params.year, res);
              })
                .then((monthly) => {
                  logger.info(monthly);
                  res.send(monthly);
                })
                .catch((error) => {
                  logger.info(error);
                  res.send({
                    error:
                      "Failed to get monthly connect type data, maybe verify your params",
                  });
                });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error:
                "Failed to get monthly connect type data, maybe verify your params",
            });
          });
      });

      // Monthly Payment method counts ( Successfull and cancelled rides )
      app.get("/rides-plot-data/per-month-payment-method/:year", (req, res) => {
        logger.info("VISUALIZER API Called (Payment Method)");
        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res.send({
                error:
                  "Failed to get rides monthly data @General Data format function level",
              });
            } else {
              new Promise((res) => {
                MonthlyDataCountPaymentMethod(result, req.params.year, res);
              })
                .then((monthly) => {
                  logger.info(monthly);
                  res.send(monthly);
                })
                .catch((error) => {
                  logger.info(error);
                  res.send({
                    error:
                      "Failed to get monthly payment method data, maybe verify your params",
                  });
                });
            }
          })
          .catch((error) => {
            logger.info(error);
            res.send({
              error:
                "Failed to get monthly payment method data, maybe verify your params",
            });
          });
      });

      /**
       * *-------------------------------------------------------------------------------
       *  * MONTHLY DETAILED DATA APIS
       * *-------------------------------------------------------------------------------
       */

      app.get("/ridesDetails/:year/:monthNumber", (req, res) => {
        logger.info("RIDES DETAILEDS API CALLED");
        //new Promise((result) => {

        // Filtering query
        const query = {
          ride_mode: "RIDE",
          isArrivedToDestination: true,
          "ride_state_vars.isRideCompleted_riderSide": true,
          "ride_state_vars.isRideCompleted_driverSide": true,
        };
        new Promise((fire) => {
          GeneralPlottingData(
            collectionRidesDeliveryData,
            collectionRidesDeliveryDataCancelled,
            query,
            fire
          );
        })
          .then((result) => {
            if (result.error) {
              logger.info(" An error occured @GeneralPlottingData");
              res
                .status(500)
                .send({ error: "Failed to get GeneralPlotting Data" });
            } else {
              try {
                utils
                  .getRidesMonthDetailedData(
                    result,
                    req.params.year.replace(/\s/g, ""),
                    req.params.monthNumber.replace(/\s/g, "")
                  )
                  .then((monthData) => {
                    res.status(201).send(monthData);
                  })
                  .catch((error) => {
                    logger.info(error);
                    res.status(500).send({
                      error:
                        "Failed to process getting Rides Monthly Detailed Data 1!",
                    });
                  });
              } catch (error) {
                logger.info(error);
                res.status(500).send({
                  error:
                    "Failed to process getting Rides Monthly Detailed Data 2!",
                });
              }
            }
          })
          .catch((error) => {
            logger.info(error);
            res.status(500).send({
              error: "Failed to process getting Rides Monthly Detailed data",
            });
          });
        //})
      });
    }
  }
);

app.get("/test", (req, res) => {
  res
    .status(200)
    .json({ hasSucceeded: true, message: "plot server up and running!" });
});

server.listen(PORT, () => {
  logger.info(`Plot server up and running @ port ${PORT}`);
});
