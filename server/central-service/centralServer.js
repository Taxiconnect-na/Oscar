require("newrelic");
const path = require("path");
require("dotenv").config({ path: __dirname + "/./../.env" });
const { logger } = require("../LogService");

const express = require("express");
const app = express();
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const http = require("http");
const fetch = require("node-fetch");
const requestAPI = require("request");

// Import helmet for http headers protection
const helmet = require("helmet");
const server = http.createServer(app);
const socketIo = require("socket.io");

const io = socketIo(server, {
  cors: {
    origin: "http://54.88.251.169",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(helmet());
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

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

/**
 * @function GetCashWallet : Returns the total money of trips in progress, scheduled and completed
 *                          Of a given array of rides (cash and delivery returned)
 * @param {array} arrayData : An array of rides from either an API or Database of rides with known
 *                            keys.
 *
 */

function GetCashWallet(arrayData, resolve) {
  let fare_array = [];
  let fare_array_cash = [];
  let fare_array_wallet = [];
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);

  arrayData.map((ride) => {
    fare_array.push(Number(ride["amount"]));

    // Get rides with CASH as payment method
    let payment_method = ride["payment_method"].toUpperCase().trim();
    if (/CASH/i.test(payment_method)) {
      // if (payment_method ==="CASH") /CASH/ makes sure of spacing
      fare_array_cash.push(Number(ride["amount"]));
    } else {
      fare_array_wallet.push(Number(ride["amount"]));
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
 * @function progressScheduledCompleted : Returns the total count and money of trips in progress,
 *                                        scheduled and completed
 *                          Of a given array of rides (cash and delivery returned)
 * @param {array} arrayData : An array of rides from either an API or Database of rides with known
 *                            keys.
 *
 */

function progressScheduledCompleted(arrayData, resolve) {
  let progress = arrayData.filter((current) => {
    return !current.isArrivedToDestination;
  });

  let scheduled = arrayData.filter((current) => {
    let Value =
      current.request_type === "scheduled" &&
      current.isArrivedToDestination === false;
    return Value;
  });
  let completed = arrayData.filter((current) => {
    return current.isArrivedToDestination;
  });

  let completed_today = arrayData.filter((current) => {
    let startOfToday = new Date();
    let convertToday = new Date(startOfToday.setHours(0, 0, 0, 0))
      .addHours(2)
      .toISOString();
    /*logger.info(current.date_time)
        logger.info(startOfToday)
        
        logger.info(`today start: ${convertToday}`)
        logger.info(`received date: ${current.date_time}`) */
    let today = new Date(current.date_time) > new Date(convertToday);
    logger.info(`Date comparison result: ${today}`);
    return today && current.isArrivedToDestination;
  });
  logger.info(completed_today);

  Promise.all([
    //let progressMoney = GetCashWallet(scheduled)
    new Promise((res) => {
      GetCashWallet(progress, res);
    }),
    new Promise((res) => {
      GetCashWallet(scheduled, res);
    }),
    //let progressMoney = GetCashWallet(scheduled)
    new Promise((res) => {
      GetCashWallet(completed, res);
    }),
    new Promise((res) => {
      GetCashWallet(completed_today, res);
    }),
  ])
    .then((future) => {
      let [progressMoney, scheduledMoney, completedMoney, completedMoneyToday] =
        future;
      let Object = {};
      Object.moneyInprogress = progressMoney;
      Object.moneyScheduled = scheduledMoney;
      Object.moneyCompleted = completedMoney;
      Object.moneyCompletedToday = completedMoneyToday;
      Object.inprogress = progress.length;
      Object.scheduled = scheduled.length;
      Object.completed = completed.length;
      Object.completed_today = completed_today.length;
      logger.info("------------------------------");
      //logger.info(arrayData)
      resolve(Object);
    })
    .catch((error) => {
      logger.info(error);
      resolve({
        response: "error",
        flag: "Possibly invalid input parameters",
      });
    });
}

function MyFormData(file_value, fingerprint, resolve) {
  // Initialize formData
  const formData = new FormData();

  // Append data to formData
  formData.append("taxi_picture", file_value);
  formData.append("fingerprint", fingerprint);

  logger.info(formData);

  resolve(formData);
}

function driverPaymentForm(taxi_number, paymentNumber, amount, resolve) {
  // Initialize form
  const paymentForm = new FormData();
  //Append data to form:
  paymentForm.append("taxi_number", taxi_number);
  paymentForm.append("paymentNumber", paymentNumber);
  paymentForm.append("amount", amount);

  resolve(paymentForm);
}

function rideIdForm(id, resolve) {
  // Initialize form
  const idRideForm = new FormData();
  //Append data to form:
  idRideForm.append("id", id);

  resolve(idRideForm);
}
// All Events:

io.on("connection", (socket) => {
  // Confirm a connection
  logger.info("New client connection");

  // statistics event listener
  socket.on("statistics", function (data) {
    logger.info("event caught from client -> ", data);
    axios
      .get(`${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/statistics`)
      .then((feedback) => {
        //logger.info(feedback.data.totalFareSuccessful)

        let statistics = {
          totalFareSuccessful: feedback.data.totalFareSuccessful,
          totalTripSuccessful: feedback.data.totalTripSuccessful,
          totalFareCancelled: feedback.data.totalFareCancelled,
          totalTripCancelled: feedback.data.totalTripCancelled,
          totalFareSuccessfulToday: feedback.data.totalFareSuccessfulToday,
          totalTripSuccessfulToday: feedback.data.totalTripSuccessfulToday,
          totalFareCancelledToday: feedback.data.totalFareCancelledToday,
          totalTripCancelledToday: feedback.data.totalTripCancelledToday,
          totalNewDriverToday: feedback.data.totalNewDriverToday,
          totalNewPassengerToday: feedback.data.totalNewPassengerToday,
          totalCash: feedback.data.totalCash,
          totalWallet: feedback.data.totalWallet,
        };

        //logger.info(statistics)

        //response.json(statistics)
        socket.emit("statistics-response", statistics);
      })
      .catch((error) => {
        logger.info(error);
      });
  });

  // Get rides (in progress and completed)
  socket.on("getRideOverview", function (data) {
    if (data !== undefined && data != null) {
      logger.info(`getRideOverview emitted: ${data}`);
      axios
        .get(`${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/ride-overview`)
        .then((feedback) => {
          let rideOverview = feedback.data;

          logger.info("===================RIDES=============================");
          //logger.info(feedback.data)

          socket.emit("getRideOverview-response", rideOverview);

          // Split data into progress, completed, scheduled
          new Promise((res) => {
            progressScheduledCompleted(feedback.data, res);
          })
            .then((future) => {
              //logger.info(future)
              socket.emit("getRideOverview-response-scatter", future);
            })
            .catch((error) => {
              logger.info(error);
            });
        })
        .catch((error) => {
          logger.info(error);
        });
    }
  });

  // Get rides and deliveries count for today
  socket.on("get-trips-in-progress-count", (data) => {
    if (data !== undefined && data != null) {
      logger.info("====== Getting trips in progress count======");
      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/inprogress-ride-delivery-count-today`
        )
        .then((feedback) => {
          logger.info(feedback.data);
          socket.emit("get-trips-in-progress-count-feedback", {
            todayRidesProgressCount: feedback.data.ride_in_progress_count_today,
            todayDeliveryProgressCount:
              feedback.data.delivery_in_progress_count_today,
          });
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-trips-in-progress-count-feedback", { error: true });
        });
    }
  });

  // Get Deliveries (in progress and completed)
  socket.on("getDeliveryOverview", function (data) {
    if (data !== undefined && data != null) {
      logger.info(`getDeliveryOverview emitted: ${data}`);
      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/delivery-overview`
        )
        .then((feedback) => {
          let deliveryOverview = feedback.data;
          //logger.info(feedback.data)

          socket.emit("getDeliveryOverview-response", deliveryOverview);

          // Split data into progress, completed, scheduled
          new Promise((res) => {
            progressScheduledCompleted(feedback.data, res);
          })
            .then((future) => {
              //logger.info(future)
              socket.emit("getDeliveryOverview-response-scatter", future);
            })
            .catch((error) => {
              logger.info(error);
            });
        })
        .catch((error) => {
          logger.info(error);
        });
    }
  });

  // Get delivery provider's data
  socket.on("getPartnerData", function (data) {
    if (data !== undefined && data != null) {
      logger.info(`getPartnerData emitted with credentials: ${data}`);
      try {
        axios
          .get(
            `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/delivery-provider-data/${data.provider}`
          )
          .then(
            (feedback) => {
              //logger.info(feedback.data)

              let partnerData = {
                drivers: feedback.data.drivers_list,
                drivers_count: feedback.data.drivers_count,
                total_money: feedback.data.total_money,
                total_money_today: feedback.data.total_money_today,
              };

              socket.emit("getPartnerData-response", partnerData);
            },
            (error) => {
              logger.info(`Exited with error code: ${error.response.status}`);
              socket.emit("getPartnerData-response", error.response.status);
            }
          );
      } catch (error) {
        logger.info(error);
      }
    }
  });

  // Authenticate owner:
  socket.on("authenticate", function (data) {
    if (data !== undefined && data !== null) {
      logger.info("Authenticating...");
      //logger.info(data)

      try {
        axios
          .post(
            `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/authenticate-owner`,
            data
          )
          .then((feedback) => {
            //logger.info(feedback.data)

            socket.emit("authenticate-response", feedback.data);
          })
          .catch((error) => {
            logger.info(error);
            socket.emit("authenticate-response", feedback.data);
          });
      } catch (error) {
        logger.info(error);
        socket.emit("authenticate-response", feedback.data);
      }
    }
  });

  // Authenticate admin user:
  socket.on("authenticate_internal_admin", function (data) {
    if (data !== undefined && data !== null) {
      logger.info("Authenticating admin user...");
      //logger.info(data)

      let url =
        `${process.env.LOCAL_URL}` +
        ":" +
        process.env.STATS_ROOT +
        "/authAndEventualLogin_admins";

      requestAPI.post({ url, form: data }, function (error, response, body) {
        if (error === null) {
          try {
            body = JSON.parse(body);
            //logger.info(body);
            socket.emit("authenticate_internal_admin-response", body);
          } catch (error) {
            socket.emit("authenticate_internal_admin-response", {
              response: "failed_auth",
            });
          }
        } else {
          socket.emit("authenticate_internal_admin-response", {
            response: "failed_auth",
          });
        }
      });
    }
  });

  //Responsible for getting the latest access patterns for admins and suspension infos
  socket.on("getLastesAccessAndSuspensionIfo", function (data) {
    if (data !== undefined && data !== null) {
      //logger.info(data)

      let url =
        `${process.env.LOCAL_URL}` +
        ":" +
        process.env.STATS_ROOT +
        `/getLastesAccessAndSuspensionIfoProcessor?admin_fp=${data.admin_fp}`;

      // logger.warn(url);

      requestAPI(url, function (error, response, body) {
        if (error === null) {
          try {
            body = JSON.parse(body);
            //logger.info(body);
            socket.emit("getLastesAccessAndSuspensionIfo-response", body);
          } catch (error) {
            socket.emit("getLastesAccessAndSuspensionIfo-response", {
              response: "failed_auth",
            });
          }
        } else {
          socket.emit("getLastesAccessAndSuspensionIfo-response", {
            response: "failed_auth",
          });
        }
      });
    }
  });

  //Responsible for getting the collosal data based on specific requirements: daily, weekly, monthly and or global
  socket.on("getMastiff_insightData", function (data) {
    if (data !== undefined && data !== null) {
      //logger.info(data)
      //? Isolation factor to generic view and day_zoom to 3 by default
      data.isolation_factor =
        data.isolation_factor !== undefined && data.isolation_factor !== null
          ? data.isolation_factor
          : "generic_view";
      try {
        data.day_zoom =
          data.day_zoom !== undefined && data.day_zoom !== null
            ? parseInt(data.day_zoom)
            : 3;
      } catch (error) {
        logger.error(error);
        data.day_zoom = 3;
      }

      let url =
        `${process.env.LOCAL_URL}` +
        ":" +
        process.env.STATS_ROOT +
        `/getSummaryAdminGlobal_data?isolation_factor=${data.isolation_factor}&day_zoom=${data.day_zoom}`;

      // logger.warn(url);

      requestAPI(url, function (error, response, body) {
        if (error === null) {
          try {
            body = JSON.parse(body);
            //logger.info(body);
            socket.emit("getMastiff_insightData-response", body);
          } catch (error) {
            socket.emit("getMastiff_insightData-response", {
              response: "error",
            });
          }
        } else {
          socket.emit("getMastiff_insightData-response", {
            response: "error",
          });
        }
      });
    }
  });

  /*
*===================================================================================================
//*                 Driver Data related events
*===================================================================================================
*/

  socket.on("registerDriver", function (data) {
    if (data !== undefined && data !== null) {
      logger.info(data);
      logger.info(
        "======================================================================"
      );

      axios
        .post(
          `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/upload`,
          data
        )
        .then((feedback) => {
          logger.info(feedback.data);

          // Return the server's response data to client (Gateway)
          let registration_response = new Object(feedback.data);
          // feedback.data is either {success: "X"} or {error: "Y"}
          if (registration_response.success) {
            socket.emit("registerDriver-response", {
              success: true,
              failure: false,
            });
          } else if (registration_response.error) {
            socket.emit("registerDriver-response", {
              success: false,
              failure: true,
            });
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("registerDriver-response", {
            success: false,
            failure: true,
          });
        });
    }
  });

  // upload file
  socket.on("upload-taxi-picture", function (data) {
    logger.info(data);
    try {
      if (data !== undefined && data !== null) {
        logger.info(
          "==========================================================================="
        );
        logger.info();
        logger.info(
          "==========================================================================="
        );
        logger.info(data);

        const my_object = {
          //taxi_picture: data.taxi_picture.toString("base64"),
          taxi_picture: data.taxi_picture,
          fingerprint: data.driverFingerPrint,
          taxi_picture_name: data.taxi_picture_name,
        };

        logger.info(my_object);

        axios
          .post(
            `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/upload-taxi-picture`,
            my_object
          )
          .then((feedback) => {
            logger.info(feedback.data);
            // Return the server's response data to client
            if (feedback.data.success) {
              logger.info("successful file upload");
              socket.emit("upload-taxi-picture-response", { success: true });
            } else if (feedback.data.error) {
              logger.info("something went wrong during update of ride --");
              socket.emit("upload-taxi-picture-response", {
                failure: "failed to upload files",
              });
            }
          })
          .catch((error) => {
            logger.info(error);
            socket.emit("upload-taxi-picture-response", {
              failure: "failed to upload files",
            });
          });
      }
    } catch (error) {
      logger.info(error);
    }

    //! Handled undefined and null data below with else
  });

  //Make Driver payment
  socket.on("makeDriverPayment", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to make payment...");

      new Promise((res) => {
        driverPaymentForm(
          data.taxi_number,
          data.paymentNumber,
          data.amount,
          res
        );
      })
        .then((outPaymentForm) => {
          // Make the post request to driver's endpoint with received data
          axios
            .post(
              `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/cash-payment`,
              outPaymentForm,
              {
                headers: outPaymentForm.getHeaders(),
                /* headers: { // headers option 
                        'Content-Type': 'multipart/form-data'
                    } */
              }
            )
            .then((feedback) => {
              logger.info(feedback.data);
              // Return the server's response data to client
              socket.emit("makeDriverPayment-response", feedback.data);
            })
            .catch((error) => {
              logger.info(error);
              socket.emit("makeDriverPayment-response", {
                error: "An error occured while posting data",
              });
            });
        })
        .catch((error) => {
          logger.info(
            "********An error occured while attempting to make Driver payment @central****"
          );
          socket.emit("makeDriverPayment-response", {
            error: "An error occured while posting data",
          });
          logger.info(error);
        });
    }
  });

  // Get the driver list:
  socket.on("getDrivers", function (data) {
    logger.info(`getDriver event from client ${data}`);
    axios
      .get(`${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/driver-data`)
      .then((feedback) => {
        let driverList = new Object(feedback.data);

        socket.emit("getDrivers-response", driverList);
      })
      .catch((error) => {
        logger.info(error);
      });
  });

  socket.on("getDriversWithCommission", function (data) {
    logger.info(data);

    axios
      .get(`${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/driver-data`)
      .then((feedback) => {
        let driverList = new Object(feedback.data);
        logger.info(
          `NUMBER OF DRIVERS FOUND FROM DRIVER API: ${driverList.length}`
        );

        let newDriverList = driverList.map((driver) => {
          return new Promise((future) => {
            axios
              .get(
                `${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=${driver.driver_fingerprint}`
              )
              .then((data) => {
                logger.info(data.data);

                future({
                  name: driver.name,
                  surname: driver.surname,
                  phone_number: driver.phone_number,
                  taxi_number: driver.taxi_number,
                  driver_fingerprint: driver.driver_fingerprint,
                  total_commission: data.data.header.remaining_commission
                    ? data.data.header.remaining_commission
                    : "0",
                  wallet_balance: data.data.header.remaining_due_to_driver
                    ? data.data.header.remaining_due_to_driver
                    : "0",
                  scheduled_payment_date: data.data.header
                    .scheduled_payment_date
                    ? data.data.header.scheduled_payment_date
                    : "N/A",
                });
              })
              .catch((error) => {
                logger.info(error);
                socket.emit("getDriversWithCommission-response", {
                  error: "something went wrong 1",
                });
              });
          });
        });

        Promise.all(newDriverList)
          .then((result) => {
            // Sort result by scheduled_payment_date
            let sortedList = result.sort(function (a, b) {
              return (
                new Date(b.scheduled_payment_date) -
                new Date(a.scheduled_payment_date)
              );
            });

            socket.emit(
              "getDriversWithCommission-response",
              sortedList.reverse()
            );
          })
          .catch((error) => {
            logger.info(error);
            socket.emit("getDriversWithCommission-response", {
              error: "something went wrong 2",
            });
          });
      })
      .catch((error) => {
        logger.info(error);
        socket.emit("getDriversWithCommission-response", {
          error: "something went wrong 3",
        });
      });
  });

  /*
*===================================================================================================
//*                 Trips related events
*===================================================================================================
*/

  // Get the passenger list
  socket.on("getPassengers", function (data) {
    logger.info("Requesting passengers: ", data);
    axios
      .get(
        `${process.env.LOCAL_URL}:${process.env.PASSENGER_ROOT}/passenger-data`
      )
      .then((feedback) => {
        let passengerList = new Object(feedback.data);

        socket.emit("getPassengers-feedback", passengerList);
      })
      .catch((error) => {
        logger.info(error);
      });
  });

  // Get cancelled rides by passenger
  socket.on("getCancelledRides-passenger", function (data) {
    logger.info("Requesting cancelled rides by passenger ");
    axios
      .get(
        `${process.env.LOCAL_URL}:${process.env.PASSENGER_ROOT}/cancelled-ride-passenger`
      )
      .then((result) => {
        // Check for an error
        if (result.data.error) {
          socket.emit("getCancelledRides-passenger-feedback", { error: true });
        } else {
          let cancelledRidesPassenger = new Object(result.data);

          socket.emit(
            "getCancelledRides-passenger-feedback",
            cancelledRidesPassenger
          );
        }
      })
      .catch((error) => {
        logger.info(error);
        socket.emit("getCancelledRides-passenger-feedback", { error: true });
      });
  });

  // Get cancelled rides by driver
  socket.on("getCancelledRides-drivers", function (data) {
    logger.info("Requesting cancelled rides by passenger ");
    axios
      .get(
        `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/cancelled-rides-driver`
      )
      .then((result) => {
        // Check for an error

        let cancelledRidesDrivers = new Object(result.data);

        socket.emit(
          "getCancelledRides-drivers-feedback",
          cancelledRidesDrivers
        );
      })
      .catch((error) => {
        z;
        logger.info(error);
        socket.emit("getCancelledRides-drivers-feedback", { success: false });
      });
  });

  // Get cancelled deliveries by passenger
  socket.on("getCancelledDeliveries-passenger", function (data) {
    logger.info("Requesting cancelled rides by passenger ");
    axios
      .get(
        `${process.env.LOCAL_URL}:${process.env.PASSENGER_ROOT}/cancelled-deliveries-passenger`
      )
      .then((result) => {
        // Check for an error
        if (result.data.error) {
          socket.emit("getCancelledDeliveries-passenger-feedback", {
            error: true,
          });
        } else {
          let cancelledDeliveriesPassenger = new Object(result.data);

          socket.emit(
            "getCancelledDeliveries-passenger-feedback",
            cancelledDeliveriesPassenger
          );
        }
      })
      .catch((error) => {
        logger.info(error);
        socket.emit("getCancelledDeliveries-passenger-feedback", {
          error: true,
        });
      });
  });

  // Confirm ride
  socket.on("ConfirmRide", function (data) {
    logger.info(
      `***********************confirming ride with fingerprint: ${data.request_fp} ***********************`
    );
    logger.info(
      "********************************************************************************************"
    );
    logger.info(data);
    if (data !== undefined && data !== null) {
      axios
        .post(
          `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/set-ride-confirmed`,
          data
        )
        .then((feedback) => {
          logger.info(feedback.data);
          // Return the server's response data to client
          if (feedback.data.success) {
            logger.info("successful ride update");
            socket.emit("ConfirmRide-feedback", { success: true });
          } else if (feedback.data.error) {
            logger.info("something went wrong during update of ride --");
            socket.emit("ConfirmRide-feedback", { success: false });
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("ConfirmRide-feedback", { success: false });
        });
    }
  });

  // Cancell trip (ride)
  socket.on("CancellTrip", (data) => {
    if (data !== undefined && data !== null) {
      axios
        .post(
          `${process.env.LOCAL_URL}:${process.env.STATS_ROOT}/cancell-trip`,
          data
        )
        .then((feedback) => {
          logger.info(feedback.data);
          // Return the server's response data to client
          if (feedback.data.success) {
            logger.info("successful trip cancellation");
            socket.emit("CancellTrip-feedback", { success: true });
          } else if (feedback.data.error) {
            logger.info("something went wrong while cancelling trip--");
            socket.emit("CancellTrip-feedback", { success: false });
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("CancellTrip-feedback", { success: false });
        });
    } else if (data !== undefined && data !== null) {
      socket.emit("CancellTrip-feedback", { success: false });
    }
  });

  /*
    *===================================================================================================
    //*                 Data Visualization related events
    *===================================================================================================
    */

  // Socket getting rides visualisation data (monthly-counts)
  socket.on("get-rides-count-vis", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to get rides counts visualization data");

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-count/${data.year}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-rides-count-vis-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit("get-rides-count-vis-feedback", response);
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-rides-count-vis-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  // Socket getting rides visualisation data (monthly-sales)
  socket.on("get-rides-grossSales-vis", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to get monthly gross sales visualization data");

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-gross-sales/${data.year}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-rides-grossSales-vis-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit("get-rides-grossSales-vis-feedback", response);
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-rides-grossSales-vis-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  // Getting commission: total monthly commission fares
  socket.on("get-rides-revenues-vis", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to get monthly gross sales visualization data");

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-revenues/${data.year}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-rides-revenues-vis-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit("get-rides-revenues-vis-feedback", response);
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-rides-revenues-vis-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  // Get monthly connect type counts
  socket.on("get-monthly-connect-type-vis", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to get monthly gross sales visualization data");

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-connect-type/${data.year}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-monthly-connect-type-vis-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit("get-monthly-connect-type-vis-feedback", response);
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-monthly-connect-type-vis-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  // Get monthly connect type counts
  socket.on("get-monthly-payment-method-count-vis", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("Attempting to get monthly gross sales visualization data");

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-payment-method/${data.year}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-monthly-payment-method-count-vis-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit(
              "get-monthly-payment-method-count-vis-feedback",
              response
            );
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-monthly-payment-method-count-vis-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  // Get Detailed monthly rides
  socket.on("get-monthly-per-day-rides-data", (data) => {
    if (data !== undefined && data !== null) {
      logger.info(
        `Attempting to get detailed monthly per day rides data with ${data.year} ${data.monthNumber}`
      );

      axios
        .get(
          `${process.env.LOCAL_URL}:${process.env.PLOT_ROOT}/ridesDetails/${data.year}/${data.monthNumber}`
        )
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.error) {
            socket.emit("get-monthly-per-day-rides-data-feedback", {
              error: true,
              empty: false,
            });
          } else {
            socket.emit("get-monthly-per-day-rides-data-feedback", response);
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("get-monthly-per-day-rides-data-feedback", {
            error: true,
            empty: false,
          });
        });
    }
  });

  /**
   * * Test-socket
   */
  // Socket test event
  socket.on("socket-test", (data) => {
    if (data !== undefined && data !== null) {
      logger.info("socket test in progress");

      axios
        .get(`${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/socket-test`)
        .then((feedback) => {
          let response = new Object(feedback.data);
          logger.info(response);
          if (response.success) {
            setTimeout(() => {
              //socket.emit("socket-test-response", response)
              socket.emit("socket-test-response", {
                failure: true,
                success: false,
              });
            }, 5000);
            //socket.emit("socket-test-response", response)
            //socket.emit("socket-test-response", {failure:true, success: false})
          } else {
            socket.emit("socket-test-response", {
              failure: true,
              success: false,
            });
          }
        })
        .catch((error) => {
          logger.info(error);
          socket.emit("socket-test-response", {
            failure: true,
            success: false,
          });
        });
    } else if (data === undefined || data === null) {
      socket.emit("socket-test-response", { failure: true, success: false });
    }
  });
});

/**
 * *=============================================
 * * ROUTES DEALING WITH DRIVER DATA
 * *=============================================
 */

app.get("/", (req, res) => {
  res.send("Central server running");
});

// *Updates basic information about the driver, excluding files
app.post("/update-driver-info", async (req, res) => {
  //document to be updated
  const information = {
    driverFingerPrint: req.body.driverFingerPrint,
    old_taxi_number: req.body.old_taxi_number,
    name: req.body.name,
    surname: req.body.surname,
    phone_number: req.body.phone_number.replace(/\s/g, "").startsWith("+")
      ? req.body.phone_number.replace(/\s/g, "")
      : "+" + req.body.phone_number.replace(/\s/g, ""),
    taxi_number: req.body.taxi_number,
    plate_number: req.body.plate_number,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(information),
  };

  logger.info(information);

  try {
    const data = await fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-driver-info`,
      options
    );
    const feedback = await data.json();

    if (feedback.success) {
      logger.info("successful file upload");
      res.send({ success: true });
    } else if (feedback.error) {
      logger.info("something went wrong during update of ride --");
      res.send({ failure: "failed to upload files" });
    }
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/file", (req, res) => {
  const my_object = {
    //taxi_picture: data.taxi_picture.toString("base64"),
    taxi_picture: req.body.taxi_picture,
    fingerprint: req.body.driverFingerPrint,
    taxi_picture_name: req.body.taxi_picture_name,
    taxi_number: req.body.taxi_number,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object.fingerprint);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/upload-taxi-picture`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info("something went wrong during update of ride --");
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/profile-picture", (req, res) => {
  const my_object = {
    //taxi_picture: data.taxi_picture.toString("base64"),
    profile_picture: req.body.profile_picture,
    fingerprint: req.body.driverFingerPrint,
    profile_picture_name: req.body.profile_picture_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object.fingerprint);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-profile-picture`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info("something went wrong during update of profile file --");
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/driver-licence", (req, res) => {
  const my_object = {
    driver_licence: req.body.driver_licence,
    fingerprint: req.body.driverFingerPrint,
    driver_licence_doc_name: req.body.driver_licence_doc_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object.fingerprint);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-driver-licence`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info(
            "something went wrong during update of driver licence file --"
          );
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/id-paper", (req, res) => {
  const my_object = {
    copy_id_paper: req.body.copy_id_paper,
    fingerprint: req.body.driverFingerPrint,
    copy_id_paper_name: req.body.copy_id_paper_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-id-paper`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info(
            "something went wrong during update of id paper file @driver-service--"
          );
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/white-paper", (req, res) => {
  const my_object = {
    copy_white_paper: req.body.copy_white_paper,
    fingerprint: req.body.driverFingerPrint,
    copy_white_paper_name: req.body.copy_white_paper_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object.fingerprint);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-white-paper`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info(
            "something went wrong during update of white paper file --"
          );
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/public-permit", (req, res) => {
  const my_object = {
    copy_public_permit: req.body.copy_public_permit,
    fingerprint: req.body.driverFingerPrint,
    copy_public_permit_name: req.body.copy_public_permit_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-public-permit`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info(
            "something went wrong during update of public permit file --"
          );
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/blue-paper", (req, res) => {
  const my_object = {
    copy_blue_paper: req.body.copy_blue_paper,
    fingerprint: req.body.driverFingerPrint,
    copy_blue_paper_name: req.body.copy_blue_paper_name,
  };
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };
  logger.info(my_object.fingerprint);
  // Send request to driver server:
  try {
    fetch(
      `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/update-blue-paper`,
      options
    )
      .then((response) => response.json())
      .then((feedback) => {
        logger.info(feedback);
        // Return the server's response data to client
        if (feedback.success) {
          logger.info("successful file upload");
          res.send({ success: true });
        } else if (feedback.error) {
          logger.info(
            "something went wrong during update of blue paper file --"
          );
          res.send({ failure: "failed to upload files" });
        }
      })
      .catch((error) => {
        logger.info(error);
        res.send({ failure: "failed to upload files" });
      });
  } catch (error) {
    logger.info(error);
    res.send({ failure: "failed to upload files" });
  }
});

app.post("/driver-commission-payment", (req, res) => {
  logger.info("DRIVER DATA COMMISION @CENTRAL");

  const my_object = {
    driver_fingerprint: req.body.driver_fingerprint,
    amount: Number(req.body.amount),
  };
  logger.info(my_object);
  // Set post request parameters
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(my_object),
  };

  fetch(
    `${process.env.LOCAL_URL}:${process.env.DRIVER_ROOT}/driver-commission-payment`,
    options
  )
    .then((response) => response.json())
    .then((feedback) => {
      logger.info(feedback);
      if (feedback.error) {
        res.send({
          error: " Something went wrong @commission payment @central",
        });
      }
      res
        .status(200)
        .send({ success: "successful commission payment was made" });
    })
    .catch((error) => {
      logger.info(error);
      res.send({ error: " Something went wrong @commission payment @central" });
    });
});

/**
 * *========================================================================
 *  *    RUSH
 * *========================================================================
 *
 */

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

function FilterYearRideTypePaymentMethod(
  transaction_data,
  transaction_nature,
  year,
  payment_method
) {
  // Filter for "RIDES"
  return new Promise((resolve, reject) => {
    let filtered_rides = transaction_data.filter((ride) => {
      return ride.transaction_nature === transaction_nature;
    });

    logger.info(filtered_rides.length);

    let year2021_filtered = filtered_rides.filter((ride) => {
      return new Date(ride.rawDate_made).getFullYear().toString() === year;
    });

    logger.info(year2021_filtered.length);

    let payment_method_filtered = year2021_filtered.filter((ride) => {
      return ride.payment_method === payment_method;
    });

    resolve(payment_method_filtered);
  }).catch((error) => {
    logger.info(error);
    reject({ error: true });
  });
}

function SumAmountField(object) {
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0); // The sum function
  //Initialize array
  let finalArray = object.map((each) => {
    return each.amount;
  });

  return Sum(finalArray);
}

function getMonthName(number) {
  switch (number) {
    case "1":
      return "January";
      break;
    case "2":
      return "February";
      break;
    case "3":
      return "March";
      break;
    case "4":
      return "April";
      break;
    case "5":
      return "May";
      break;
    case "6":
      return "June";
      break;
    case "7":
      return "July";
      break;
    case "8":
      return "August";
      break;
    case "9":
      return "September";
      break;
    case "10":
      return "October";
      break;
    case "11":
      return "November";
      break;
    case "12":
      return "December";
      break;
  }
}

app.post("/view-earnings", (req, res) => {
  //172.31.20.41
  logger.info(req.body.driverFingerPrint);
  axios
    .get(
      `${process.env.JERRY_ACCOUNT_SERVICE}/getDrivers_walletInfosDeep?user_fingerprint=${req.body.driverFingerPrint}&transactionData=true`
    )
    //.then(response => response.json())
    .then((data) => {
      logger.info("Attempting ========>");
      //logger.info(data.data)
      FilterYearRideTypePaymentMethod(
        data.data.transactions_data,
        "RIDE",
        "2021",
        "CASH"
      ).then((result) => {
        //logger.info(result.length)

        let newObject = result.map((trans) => {
          return new Promise((resolve) => {
            resolve({
              amount: trans.amount,
              month: (new Date(trans.rawDate_made).getMonth() + 1).toString(),
            });
          }).catch((error) => {
            logger.info(error);
            //resolve({error: "somthing fishy"})
            res.send({ error: "could not process" });
          });
        });

        Promise.all(newObject)
          .then((result) => {
            //logger.info(result)
            logger.info("========================================");
            let grouped = result.groupBy("month");

            let groupedArranged = grouped.map((category) => {
              //logger.info(category)

              return new Promise((resolve) => {
                // Compute sum of the groupList part
                // resolve sum and corresponding month
                resolve({
                  total_cash: SumAmountField(category.groupList)
                    ? SumAmountField(category.groupList)
                    : 0,
                  month: getMonthName(category.field)
                    ? getMonthName(category.field)
                    : null,
                });
              });
            });

            Promise.all(groupedArranged)
              .then((outcome1) => {
                logger.info(outcome1);
                let cashEarning = { cash: outcome1.reverse() };
                //res.send(outcome)
                //!!===================================================TO BE FACTORED AS FUNCTION
                FilterYearRideTypePaymentMethod(
                  data.data.transactions_data,
                  "RIDE",
                  "2021",
                  "WALLET"
                ).then((result5) => {
                  //logger.info(result.length)
                  logger.info("=======================");
                  logger.info(result5);
                  logger.info("=======================");
                  let newObject2 = result5.map((trans2) => {
                    return new Promise((resolve) => {
                      resolve({
                        amount: trans2.amount,
                        month: (
                          new Date(trans2.rawDate_made).getMonth() + 1
                        ).toString(),
                      });
                    }).catch((error) => {
                      logger.info(error);
                      //resolve({error: "somthing fishy"})
                      res.send({ error: "could not process" });
                    });
                  });

                  Promise.all(newObject2)
                    .then((result2) => {
                      //logger.info(result)
                      logger.info("========================================");
                      let grouped2 = result2.groupBy("month");

                      let groupedArranged2 = grouped2.map((category2) => {
                        //logger.info(category)

                        return new Promise((resolve) => {
                          // Compute sum of the groupList part
                          // resolve sum and corresponding month
                          resolve({
                            total_wallet: SumAmountField(category2.groupList)
                              ? SumAmountField(category2.groupList)
                              : 0,
                            month: getMonthName(category2.field)
                              ? getMonthName(category2.field)
                              : null,
                          });
                        });
                      });

                      Promise.all(groupedArranged2)
                        .then((outcome2) => {
                          let walletEarning = { wallet: outcome2.reverse() };

                          res.send({ ...cashEarning, ...walletEarning });
                        })
                        .catch((error) => {
                          logger.info(error);
                          res.send({ error: "could not process" });
                        });
                    })
                    .catch((error) => {
                      logger.info(error);
                      res.send({ error: "could not process" });
                    });
                });

                // !!============================================
              })
              .catch((error) => {
                logger.info(error);
                res.send({ error: "could not process" });
              });
          })
          .catch((error) => {
            logger.info(error);
            res.send({ error: "could not process" });
          });
      });
    })
    .catch((error) => {
      logger.info(error);
    });
});

app.get("/test", (req, res) => {
  res.send({ message: "central server running" });
});

server.listen(process.env.CENTRAL_PORT, () => {
  logger.info(
    `Central server up and running at port ${process.env.CENTRAL_PORT}!!`
  );
});
