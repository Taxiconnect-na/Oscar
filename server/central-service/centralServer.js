console.log = function () {};
const path = require('path')
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});
const express = require("express")
const app = express()  
const axios = require("axios")
const FormData = require("form-data")
const cors = require("cors")
const http = require("http")
//const https = require("https")
const fs = require("fs")
const fetch = require('node-fetch')
/*Options to be passed to https server

const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "/etc/letsencrypt/live/taxiconnectnanetwork.com/privkey.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "/etc/letsencrypt/live/taxiconnectnanetwork.com/cert.pem"))
}

const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "../Encryptions/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../Encryptions/cert.pem"))
}
*/
// Import helmet for http headers protection
const helmet = require("helmet")

const server = http.createServer(app)
//const server = https.createServer(sslOptions, app)
const socketIo = require("socket.io");
const bodyParser = require('body-parser');
const io = socketIo(server, { cors: {
    origin: "https://taxiconnectnanetwork.com",
    //origin: "http://localhost",
    //origin: "http://192.168.8.151",
    methods: ["GET", "POST"],
    credentials: true
    },
})

app.use(helmet())
app.use(express.json({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(express.urlencoded({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(cors())


const PORT = process.env.CENTRAL_PORT



Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}

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

    resolve(CashWalletObject)

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
    
    let progress = arrayData.filter(current => {
        return !current.isArrivedToDestination
    })

    let scheduled = arrayData.filter(current => {
        let Value = current.request_type === "scheduled" && current.isArrivedToDestination===false
        return Value
    })
    let completed = arrayData.filter( current => {
        return current.isArrivedToDestination
    })

    let completed_today = arrayData.filter( current => {
        let startOfToday = (new Date())
        let convertToday = ((new Date(startOfToday.setHours(0, 0, 0, 0))).addHours(2).toISOString())
        /*console.log(current.date_time)
        console.log(startOfToday)
        
        console.log(`today start: ${convertToday}`)
        console.log(`received date: ${current.date_time}`) */
        let today = (new Date(current.date_time)) > (new Date(convertToday))
        console.log(`Date comparison result: ${today}`)
        return (today && current.isArrivedToDestination)
    })
    console.log(completed_today)
    
    Promise.all([
            //let progressMoney = GetCashWallet(scheduled)
        new Promise((res) => {
            GetCashWallet(progress, res)
        }),
        new Promise((res) => {
            GetCashWallet(scheduled, res)
        }),
        //let progressMoney = GetCashWallet(scheduled)
        new Promise((res) => {
            GetCashWallet(completed, res)
        }),
        new Promise((res) => {
            GetCashWallet(completed_today,res)
        })

    ]).then((future) => {
        let [progressMoney, scheduledMoney, completedMoney, completedMoneyToday] = future
        let Object = {}
        Object.moneyInprogress = progressMoney
        Object.moneyScheduled = scheduledMoney
        Object.moneyCompleted = completedMoney
        Object.moneyCompletedToday = completedMoneyToday
        Object.inprogress = progress.length
        Object.scheduled = scheduled.length
        Object.completed = completed.length
        Object.completed_today = completed_today.length
        console.log("------------------------------")
        //console.log(arrayData)
        resolve(Object)
    }).catch((error) => {

        console.log(error)
        resolve({
            response: "error",
            flag: "Possibly invalid input parameters",
        })
    })
 
}



function MyFormData(file_value, fingerprint, resolve) {

    // Initialize formData
    const formData = new FormData()

    // Append data to formData
    formData.append( "taxi_picture" , file_value)
    formData.append("fingerprint", fingerprint)

    console.log(formData)

    resolve(formData)

}

function driverPaymentForm(taxi_number, paymentNumber, amount, resolve) {
    // Initialize form
    const paymentForm = new FormData()
    //Append data to form:
    paymentForm.append('taxi_number', taxi_number)
    paymentForm.append('paymentNumber', paymentNumber)
    paymentForm.append('amount', amount)

    resolve(paymentForm)
}

function rideIdForm(id, resolve) {
    // Initialize form
    const idRideForm = new FormData()
    //Append data to form:
    idRideForm.append('id', id)
    
    resolve(idRideForm)
}
// All Events: 

io.on("connection", (socket) => {
    // Confirm a connection
    console.log("New client connection")

    // statistics event listener
    socket.on('statistics', function(data) {
        console.log('event caught from client -> ', data);
        axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/statistics`)
        .then((feedback) => {
        //console.log(feedback.data.totalFareSuccessful)

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
                totalWallet: feedback.data.totalWallet
            }

            //console.log(statistics)

            //response.json(statistics)
            socket.emit("statistics-response", statistics)
            
        
        }).catch((error) => {
            console.log(error)
        })
    });

    // Get rides (in progress and completed)
    socket.on("getRideOverview", function(data) {
        if ((data !== undefined) && (data != null ) ) {
            console.log(`getRideOverview emitted: ${data}`)
            axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/ride-overview`)
            .then((feedback) => {
                let rideOverview = feedback.data

                console.log("===================RIDES=============================")
                //console.log(feedback.data)

                socket.emit("getRideOverview-response", rideOverview)

                // Split data into progress, completed, scheduled
                new Promise((res) => {
                    progressScheduledCompleted(feedback.data, res)
                }).then((future) => {
                    //console.log(future)
                    socket.emit("getRideOverview-response-scatter", future)
                    
                }).catch((error) => {
                    console.log(error)
                })
            })
            .catch((error) => {
                console.log(error)
            })
        }
        
    })

    // Get rides and deliveries count for today
    socket.on("get-trips-in-progress-count", (data) => {
        if ((data !== undefined) && (data != null)) {
            console.log("====== Getting trips in progress count======")
            axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/inprogress-ride-delivery-count-today`)
            .then((feedback) => {
                console.log(feedback.data)
                socket.emit("get-trips-in-progress-count-feedback", {
                    todayRidesProgressCount: feedback.data.ride_in_progress_count_today,
                    todayDeliveryProgressCount: feedback.data.delivery_in_progress_count_today
                })
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-trips-in-progress-count-feedback", {error: true})
            })

        }
    })
    
    // Get Deliveries (in progress and completed)
    socket.on("getDeliveryOverview", function(data) {
        if ((data !== undefined) && (data != null ) ) {
            console.log(`getDeliveryOverview emitted: ${data}`)
            axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/delivery-overview`)
            .then((feedback) => {
                let deliveryOverview = feedback.data
                //console.log(feedback.data)

                socket.emit("getDeliveryOverview-response", deliveryOverview)
                
                // Split data into progress, completed, scheduled
                new Promise((res) => {
                    progressScheduledCompleted(feedback.data, res)
                })
                .then((future) => {
                    //console.log(future)
                    socket.emit("getDeliveryOverview-response-scatter", future)
                    
                })
                .catch((error) => {
                    console.log(error)
                })

            })
            .catch((error) => {
                console.log(error)
            })
        }
        
    })

    // Get delivery provider's data
    socket.on("getPartnerData", function(data) {
        if ((data !== undefined) && (data != null)) {
            console.log(`getPartnerData emitted with credentials: ${data}`)
            try {
                axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/delivery-provider-data/${data.provider}`)
                .then((feedback) => {

                    //console.log(feedback.data)

                    let partnerData = {
                        drivers: feedback.data.drivers_list,
                        drivers_count: feedback.data.drivers_count,
                        total_money: feedback.data.total_money,
                        total_money_today: feedback.data.total_money_today
                    }
                
                    socket.emit("getPartnerData-response", partnerData)
                    
                }, (error) => {
                    console.log(`Exited with error code: ${error.response.status}`)
                    socket.emit("getPartnerData-response", error.response.status)
                })

            } catch (error) {
                console.log(error)
            }
                
        }
    })
    
    // Authenticate owner:
    socket.on("authenticate", function(data) {

        if ((data !== undefined) && (data !== null)) {
            console.log("Authenticating...")
            //console.log(data)

            try {

                axios.post(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/authenticate-owner`, data)
                .then((feedback) => {

                    //console.log(feedback.data)

                    socket.emit("authenticate-response", feedback.data)

                }).catch((error) => {
                    console.log(error)
                    socket.emit("authenticate-response", feedback.data)               
                })
            } catch (error) {
                console.log(error)
                socket.emit("authenticate-response", feedback.data)
            }
        }
        
    })

    // Authenticate admin user:
    socket.on("authenticate-internal-admin", function(data) {

        if ((data !== undefined) && (data !== null)) {
            console.log("Authenticating admin user...")
            //console.log(data)

            try {

                axios.post(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/authenticate-admin`, data)
                .then((feedback) => {

                    console.log(feedback.data)

                    socket.emit("authenticate-internal-admin-response", feedback.data)

                }).catch((error) => {
                    socket.emit("authenticate-internal-admin-response", { error: true})
                    console.log(error)
                                   
                })
            } catch (error) {
                console.log(error)
                socket.emit("authenticate-internal-admin-response", { error: true})
            }
        }
        
    })

/*
*===================================================================================================
//*                 Driver Data related events
*===================================================================================================
*/


    socket.on("registerDriver", function(data) {
        if ((data !== undefined) && (data !== null)) {

            console.log(data)
            console.log("======================================================================")

            axios.post(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/upload`, data)
            .then((feedback) => {
                console.log(feedback.data)

                // Return the server's response data to client (Gateway)
                let registration_response = new Object(feedback.data)
                // feedback.data is either {success: "X"} or {error: "Y"}
                if(registration_response.success){

                    socket.emit("registerDriver-response", { success: true, failure: false})

                } else if(registration_response.error){

                    socket.emit("registerDriver-response", { success: false, failure: true})
                }
                

            })
            .catch((error) => {
                console.log(error)
                socket.emit("registerDriver-response", { success: false, failure: true})
            })
                

        }
    })
    
    // upload file
    socket.on("upload-taxi-picture", function(data) {
        console.log(data)
        try {
            if ((data !== undefined) && (data !== null)) {

            
                console.log("===========================================================================")
                console.log()
                console.log("===========================================================================")
                console.log(data)
    
                const my_object = {
                    //taxi_picture: data.taxi_picture.toString("base64"),
                    taxi_picture: data.taxi_picture,
                    fingerprint: data.driverFingerPrint,
                    taxi_picture_name: data.taxi_picture_name
                }
    
                console.log(my_object)
    
                axios.post(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/upload-taxi-picture`, my_object)
                .then((feedback) => {
                    console.log(feedback.data)
                    // Return the server's response data to client
                    if(feedback.data.success) {
                        console.log("successful file upload")
                        socket.emit("upload-taxi-picture-response", {success: true})
                    } else if(feedback.data.error){
                        console.log("something went wrong during update of ride --")
                        socket.emit("upload-taxi-picture-response", {failure: "failed to upload files"})  
                    }
                    
    
                })
                .catch((error) => {
                    console.log(error)
                    socket.emit("upload-taxi-picture-response", {failure: "failed to upload files"})
                })
                
            }

        } catch(error) {
            console.log(error)
        }
        
        //! Handled undefined and null data below with else
    })


    //Make Driver payment
    socket.on("makeDriverPayment", (data) => {
        if ((data !== undefined) && (data !== null)) {
            console.log("Attempting to make payment...")

            new Promise((res) => {
                driverPaymentForm(data.taxi_number, data.paymentNumber, data.amount, res)
            })
            .then((outPaymentForm) => {

                // Make the post request to driver's endpoint with received data
                axios.post(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/cash-payment`, outPaymentForm, {
                    headers: outPaymentForm.getHeaders()
                    /* headers: { // headers option 
                        'Content-Type': 'multipart/form-data'
                    } */
                    
                })
                .then((feedback) => {
                    console.log(feedback.data)
                    // Return the server's response data to client
                    socket.emit("makeDriverPayment-response", feedback.data)

                })
                .catch((error) => {
                    console.log(error)
                    socket.emit("makeDriverPayment-response", {error: "An error occured while posting data"})
                })

            })
            .catch((error) => {
                console.log("********An error occured while attempting to make Driver payment @central****")
                socket.emit("makeDriverPayment-response", {error: "An error occured while posting data"})
                console.log(error)
            })
        }
    })


    // Get the driver list: 
    socket.on("getDrivers", function(data) {
        console.log(`getDriver event from client ${data}`)
        axios.get(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/driver-data`)
        .then((feedback) => {
            let driverList = new Object(feedback.data)
            
            socket.emit("getDrivers-response", driverList)

        }).catch((error) => {
            console.log(error)
        })
    })

    socket.on("getDriversWithCommission", function(data) {
        console.log(data)

        axios.get(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/driver-data`)
        .then((feedback) => {
            let driverList = new Object(feedback.data)
            console.log(`NUMBER OF DRIVERS FOUND FROM DRIVER API: ${driverList.length}`)
        
            let newDriverList = driverList.map((driver) => {
                return new Promise((future) => {
                    //public:  3.101.127.13:9696   private 172.31.20.41:9696
                    axios.get(`http://172.31.20.41:9696/getDrivers_walletInfosDeep?user_fingerprint=${driver.driver_fingerprint}`)
                    .then((data) => {
    
                        console.log(data.data)
    
                        future({
                            name: driver.name,
                            surname: driver.surname,
                            phone_number: driver.phone_number,
                            taxi_number: driver.taxi_number,
                            driver_fingerprint: driver.driver_fingerprint,
                            total_commission: data.data.header.remaining_commission? data.data.header.remaining_commission:"0",
                            wallet_balance: data.data.header.remaining_due_to_driver? data.data.header.remaining_due_to_driver:"0",
                            scheduled_payment_date: data.data.header.scheduled_payment_date? data.data.header.scheduled_payment_date: "N/A"
                        })
                    })
                    .catch((error) => {
                        console.log(error)
                        socket.emit("getDriversWithCommission-response", {error: "something went wrong 1"})
                    })
                })        
            })
    
            Promise.all(newDriverList)
            .then((result) => {
                // Sort result by scheduled_payment_date
                let sortedList = result.sort(function(a,b){
                    return new Date(b.scheduled_payment_date) - new Date(a.scheduled_payment_date);
                });

                socket.emit("getDriversWithCommission-response", sortedList.reverse())
            })
            .catch((error) => {
                console.log(error)
                socket.emit("getDriversWithCommission-response", {error: "something went wrong 2"})
            })
    
        }).catch((error) => {
            console.log(error)
            socket.emit("getDriversWithCommission-response", {error: "something went wrong 3"})
        })

    })

 /*
*===================================================================================================
//*                 Trips related events
*===================================================================================================
*/
    
    // Get the passenger list
    socket.on("getPassengers", function (data) {
        console.log("Requesting passengers: ", data)
        axios.get(`${process.env.ROOT_URL}:${process.env.PASSENGER_ROOT}/passenger-data`)
        .then((feedback) => {
        let passengerList = new Object(feedback.data)
        
        socket.emit("getPassengers-feedback", passengerList)
        
        }).catch((error) => {
        console.log(error)
        })
    })

    // Get cancelled rides by passenger
    socket.on("getCancelledRides-passenger", function(data) {
        console.log("Requesting cancelled rides by passenger ")
        axios.get(`${process.env.ROOT_URL}:${process.env.PASSENGER_ROOT}/cancelled-ride-passenger`)
        .then((result) => {
            // Check for an error
            if(result.data.error) {
                socket.emit("getCancelledRides-passenger-feedback", {error: true})
            } else {
                let cancelledRidesPassenger = new Object(result.data)

                socket.emit("getCancelledRides-passenger-feedback", cancelledRidesPassenger)
            }
            
        })
        .catch((error) => {
            console.log(error)
            socket.emit("getCancelledRides-passenger-feedback", {error: true})
        })
    })

    // Get cancelled deliveries by passenger
    socket.on("getCancelledDeliveries-passenger", function(data) {
        console.log("Requesting cancelled rides by passenger ")
        axios.get(`${process.env.ROOT_URL}:${process.env.PASSENGER_ROOT}/cancelled-deliveries-passenger`)
        .then((result) => {
            // Check for an error
            if(result.data.error) {
                socket.emit("getCancelledDeliveries-passenger-feedback", {error: true})
            } else {
                let cancelledDeliveriesPassenger = new Object(result.data)

                socket.emit("getCancelledDeliveries-passenger-feedback", cancelledDeliveriesPassenger)
            }
            
        })
        .catch((error) => {
            console.log(error)
            socket.emit("getCancelledDeliveries-passenger-feedback", {error: true})
        })
    })
    
    // Confirm ride
    socket.on("ConfirmRide", function(data) {
        console.log(`***********************confirming ride with fingerprint: ${data.request_fp} ***********************`)
        console.log("********************************************************************************************")
        console.log(data)
        if ((data !== undefined) && (data !== null)) {

            axios.post(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/set-ride-confirmed`, data)
            .then((feedback) => {
                console.log(feedback.data)
                // Return the server's response data to client
                if(feedback.data.success) {
                    console.log("successful ride update")
                    socket.emit("ConfirmRide-feedback", {success: true})
                } else if(feedback.data.error){
                    console.log("something went wrong during update of ride --")
                    socket.emit("ConfirmRide-feedback", {success: false})  
                }
                

            })
            .catch((error) => {
                console.log(error)
                socket.emit("ConfirmRide-feedback", {success: false})
            })
        }
    })

    // Cancell trip (ride)
    socket.on("CancellTrip", (data) => {

        if((data !== undefined) && (data !== null)) {

            axios.post(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/cancell-trip`, data)
            .then((feedback) => {
                console.log(feedback.data)
                // Return the server's response data to client
                if(feedback.data.success) {
                    console.log("successful trip cancellation")
                    socket.emit("CancellTrip-feedback", {success: true})
                } else if(feedback.data.error){
                    console.log("something went wrong while cancelling trip--")
                    socket.emit("CancellTrip-feedback", {success: false})  
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("CancellTrip-feedback", {success: false})
            })

        } else if((data !== undefined) && (data !== null)) {
            socket.emit("CancellTrip-feedback", {success: false})

        }
    })

    /*
    *===================================================================================================
    //*                 Data Visualization related events
    *===================================================================================================
    */

    // Socket getting rides visualisation data (monthly-counts)
    socket.on("get-rides-count-vis", (data) => {
        if((data !== undefined) && (data !== null)) {
            console.log("Attempting to get rides counts visualization data")

            axios.get(`${process.env.ROOT_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-count/${data.year}`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.error){
                    socket.emit("get-rides-count-vis-feedback", {error: true, empty: false})
                } else {
                   
                    socket.emit("get-rides-count-vis-feedback", response)
                   
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-rides-count-vis-feedback", {error: true, empty: false})
            })
        }
    })

    // Socket getting rides visualisation data (monthly-sales)
    socket.on("get-rides-grossSales-vis", (data) => {
        if((data !== undefined) && (data !== null)) {
            console.log("Attempting to get monthly gross sales visualization data")

            axios.get(`${process.env.ROOT_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-gross-sales/${data.year}`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.error){
                    socket.emit("get-rides-grossSales-vis-feedback", {error: true, empty: false})
                } else {
                   
                    socket.emit("get-rides-grossSales-vis-feedback", response)
                   
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-rides-grossSales-vis-feedback", {error: true, empty: false})
            })
        }
    })

    // Getting commission: total monthly commission fares
    socket.on("get-rides-revenues-vis", (data) => {
        if((data !== undefined) && (data !== null)) {
            console.log("Attempting to get monthly gross sales visualization data")

            axios.get(`${process.env.ROOT_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-revenues/${data.year}`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.error){
                    socket.emit("get-rides-revenues-vis-feedback", {error: true, empty: false})
                } else {
                   
                    socket.emit("get-rides-revenues-vis-feedback", response)
                   
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-rides-revenues-vis-feedback", {error: true, empty: false})
            })
        }
    })

    // Get monthly connect type counts
    socket.on("get-monthly-connect-type-vis", (data) => {
        if((data !== undefined) && (data !== null)) {
            console.log("Attempting to get monthly gross sales visualization data")

            axios.get(`${process.env.ROOT_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-connect-type/${data.year}`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.error){
                    socket.emit("get-monthly-connect-type-vis-feedback", {error: true, empty: false})
                } else {
                   
                    socket.emit("get-monthly-connect-type-vis-feedback", response)
                   
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-monthly-connect-type-vis-feedback", {error: true, empty: false})
            })
        }
    })


    // Get monthly connect type counts
    socket.on("get-monthly-payment-method-count-vis", (data) => {
        if((data !== undefined) && (data !== null)) {
            console.log("Attempting to get monthly gross sales visualization data")

            axios.get(`${process.env.ROOT_URL}:${process.env.PLOT_ROOT}/rides-plot-data/per-month-payment-method/${data.year}`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.error){
                    socket.emit("get-monthly-payment-method-count-vis-feedback", {error: true, empty: false})
                } else {
                   
                    socket.emit("get-monthly-payment-method-count-vis-feedback", response)
                   
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("get-monthly-payment-method-count-vis-feedback", {error: true, empty: false})
            })
        }
    })




    /**
     * * Test-socket 
     */
    // Socket test event
    socket.on("socket-test", (data) => {

        if((data !== undefined) && (data !== null)) {

            console.log("socket test in progress")

            axios.get(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/socket-test`)
            .then((feedback) => {
                let response = new Object(feedback.data)
                console.log(response)
                if(response.success) {

                    setTimeout(() => {
                        //socket.emit("socket-test-response", response)
                        socket.emit("socket-test-response", {failure:true, success: false})
                    }, 5000)
                    //socket.emit("socket-test-response", response)
                    //socket.emit("socket-test-response", {failure:true, success: false})
                } else {
                    socket.emit("socket-test-response", {failure: true, success: false})
                }

            }).catch((error) => {
                console.log(error)
                socket.emit("socket-test-response", {failure: true, success: false})
            })
        } else if((data === undefined) || (data === null)) {
            socket.emit("socket-test-response", {failure: true, success: false})
        }
    })
    

})

/**
 * *=============================================
 * * ROUTES DEALING WITH DRIVER DATA
 * *=============================================
 */

// *Updates basic information about the driver, excluding files
app.post("/update-driver-info", async (req,res) => {

    //document to be updated
    const information = {
        driverFingerPrint: req.body.driverFingerPrint,
        old_taxi_number: req.body.old_taxi_number,
        name: req.body.name,
        surname: req.body.surname,
        phone_number: req.body.phone_number.replace(/\s/g, "").startsWith("+")? req.body.phone_number.replace(/\s/g, ""): "+" + req.body.phone_number.replace(/\s/g, ""),
        taxi_number: req.body.taxi_number,
        plate_number: req.body.plate_number
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(information)
    }

    console.log(information)

    try {
        
        const data = await fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-driver-info`, options)
        const feedback = await data.json()

        if(feedback.success) {
            console.log("successful file upload")
            res.send({success: true})
            
        } else if(feedback.error){
            console.log("something went wrong during update of ride --")
            res.send({failure: "failed to upload files"})
            
        } 
        

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
        
    }
})

app.post("/file", (req,res) => {

    const my_object = {
        //taxi_picture: data.taxi_picture.toString("base64"),
        taxi_picture: req.body.taxi_picture,
        fingerprint: req.body.driverFingerPrint,
        taxi_picture_name: req.body.taxi_picture_name,
        taxi_number: req.body.taxi_number
    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object.fingerprint)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/upload-taxi-picture`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of ride --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/profile-picture", (req,res) => {

    const my_object = {
        //taxi_picture: data.taxi_picture.toString("base64"),
        profile_picture: req.body.profile_picture,
        fingerprint: req.body.driverFingerPrint,
        profile_picture_name: req.body.profile_picture_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object.fingerprint)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-profile-picture`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of profile file --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/driver-licence", (req,res) => {

    const my_object = {
        driver_licence: req.body.driver_licence,
        fingerprint: req.body.driverFingerPrint,
        driver_licence_doc_name: req.body.driver_licence_doc_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object.fingerprint)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-driver-licence`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of driver licence file --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/id-paper", (req,res) => {

    const my_object = {
        copy_id_paper: req.body.copy_id_paper,
        fingerprint: req.body.driverFingerPrint,
        copy_id_paper_name: req.body.copy_id_paper_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-id-paper`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of id paper file @driver-service--")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/white-paper", (req,res) => {

    const my_object = {
        copy_white_paper: req.body.copy_white_paper,
        fingerprint: req.body.driverFingerPrint,
        copy_white_paper_name: req.body.copy_white_paper_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object.fingerprint)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-white-paper`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of white paper file --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/public-permit", (req,res) => {

    const my_object = {
        copy_public_permit: req.body.copy_public_permit,
        fingerprint: req.body.driverFingerPrint,
        copy_public_permit_name: req.body.copy_public_permit_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-public-permit`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of public permit file --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})


app.post("/blue-paper", (req,res) => {

    const my_object = {
        copy_blue_paper: req.body.copy_blue_paper,
        fingerprint: req.body.driverFingerPrint,
        copy_blue_paper_name: req.body.copy_blue_paper_name,

    }
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }
    console.log(my_object.fingerprint)
    // Send request to driver server:
    try {

        fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/update-blue-paper`, options)
        .then(response => response.json())
        .then((feedback) => {
            console.log(feedback)
            // Return the server's response data to client
            if(feedback.success) {
                console.log("successful file upload")
                res.send({success: true})
            } else if(feedback.error){
                console.log("something went wrong during update of blue paper file --")
                res.send({failure: "failed to upload files"})  
            }
            

        })
        .catch((error) => {
            console.log(error)
            res.send({failure: "failed to upload files"})
        })

    } catch(error) {
        console.log(error)
        res.send({failure: "failed to upload files"})
    } 
})

app.post("/driver-commission-payment", (req, res) => {

    console.log("DRIVER DATA COMMISION @CENTRAL")

    const my_object = {
        driver_fingerprint: req.body.driver_fingerprint,
        amount: Number(req.body.amount)
    }
    console.log(my_object)
    // Set post request parameters
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(my_object)
        
    }

    fetch(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/driver-commission-payment`, options)
    .then(response => response.json())
    .then((feedback) => {
        console.log(feedback)
        if(feedback.error) {
            res.send({ error: " Something went wrong @commission payment @central"})
        }
        res.status(200).send({success: "successful commission payment was made"})
    })
    .catch((error) => {
        console.log(error)
        res.send({ error: " Something went wrong @commission payment @central"})
    })

})

/**
 * *========================================================================
 *  *    RUSH
 * *========================================================================
 * 
 */

Array.prototype.groupBy = function(field){
let groupedArr = [];
this.forEach(function(e){
    //look for an existent group
    let group = groupedArr.find(g => g['field'] === e[field]);
    if (group == undefined){
    //add new group if it doesn't exist
    group = {field: e[field], groupList: []};
    groupedArr.push(group);
    }
    
    //add the element to the group
    group.groupList.push(e);
});

return groupedArr;
}


function FilterYearRideTypePaymentMethod(transaction_data, transaction_nature, year, payment_method) {
    // Filter for "RIDES"
    return new Promise((resolve, reject) => {
    let filtered_rides = transaction_data.filter((ride) => {
        return ride.transaction_nature === transaction_nature
    })

    console.log(filtered_rides.length)
    
    let year2021_filtered = filtered_rides.filter((ride) => {
        return new Date(ride.rawDate_made).getFullYear().toString() === year
    })

    console.log(year2021_filtered.length)

    let payment_method_filtered = year2021_filtered.filter((ride) => {
        return ride.payment_method === payment_method
    })

    resolve(payment_method_filtered)

    })
    .catch((error) => {
    console.log(error)
    reject({error: true})
    })

}

function SumAmountField(object) {
const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0) // The sum function
//Initialize array
let finalArray = object.map((each) => {
    return each.amount
})

return Sum(finalArray)

}

function getMonthName(number) {
switch(number) {
    case "1":
        return "January"
        break
    case "2":
        return "February"
        break
    case "3":
        return "March"
        break
    case "4":
        return "April"
        break
    case "5":
        return "May"
        break
    case "6":
        return "June"
        break
    case "7":
        return "July"
        break
    case "8":
        return "August"
        break
    case "9":
        return "September"
        break
    case "10":
        return "October"
        break
    case "11":
        return "November"
        break
    case "12":
        return "December"
        break
    
}
}


app.post("/view-earnings", (req, res) => {
    //172.31.20.41
    console.log(req.body.driverFingerPrint)
    axios.get(`http://172.31.20.41:9696/getDrivers_walletInfosDeep?user_fingerprint=${ req.body.driverFingerPrint}&transactionData=true`)
        //.then(response => response.json())
    .then((data) => {
        console.log("Attempting ========>")
        //console.log(data.data)
        FilterYearRideTypePaymentMethod(data.data.transactions_data, "RIDE", "2021", "CASH")
        .then((result) => {
            //console.log(result.length)
            
            let newObject = result.map((trans) => {
                return new Promise((resolve) => {
                    resolve({
                    amount: trans.amount,
                    month: (new Date(trans.rawDate_made).getMonth() + 1).toString(),
                    })
                })
                .catch((error) => {
                    console.log(error)
                    //resolve({error: "somthing fishy"})
                    res.send({error: "could not process"})
                })
            })

            Promise.all(newObject)
            .then((result) => {
                //console.log(result)
                console.log("========================================")
                let grouped = result.groupBy("month")

                let groupedArranged = grouped.map((category) => {
                    //console.log(category)

                    return new Promise((resolve) => {
                    // Compute sum of the groupList part
                    // resolve sum and corresponding month
                    resolve({
                        total_cash: SumAmountField(category.groupList)? SumAmountField(category.groupList) : 0 ,
                        month: getMonthName(category.field)? getMonthName(category.field) : null
                    })
                    })
                })

                Promise.all(groupedArranged)
                .then((outcome1) => {
                    console.log(outcome1)
                    let cashEarning = { cash: outcome1.reverse()}
                    //res.send(outcome)
                    //!!===================================================TO BE FACTORED AS FUNCTION
                    FilterYearRideTypePaymentMethod(data.data.transactions_data, "RIDE", "2021", "WALLET")
                    .then((result5) => {
                        //console.log(result.length)
                        console.log("=======================")
                        console.log(result5)
                        console.log("=======================")
                        let newObject2 = result5.map((trans2) => {
                            return new Promise((resolve) => {
                                resolve({
                                amount: trans2.amount,
                                month: (new Date(trans2.rawDate_made).getMonth() + 1).toString(),
                                })
                            })
                            .catch((error) => {
                                console.log(error)
                                //resolve({error: "somthing fishy"})
                                res.send({error: "could not process"})
                            })
                        })
            
                        Promise.all(newObject2)
                        .then((result2) => {
                            //console.log(result)
                            console.log("========================================")
                            let grouped2 = result2.groupBy("month")
            
                            let groupedArranged2 = grouped2.map((category2) => {
                                //console.log(category)
            
                                return new Promise((resolve) => {
                                // Compute sum of the groupList part
                                // resolve sum and corresponding month
                                resolve({
                                    total_wallet: SumAmountField(category2.groupList)? SumAmountField(category2.groupList) : 0 ,
                                    month: getMonthName(category2.field)? getMonthName(category2.field) : null
                                })
                                })
                            })
            
                            Promise.all(groupedArranged2)
                            .then((outcome2) => {
                                let walletEarning = { wallet: outcome2.reverse() }
                                
                                res.send({...cashEarning, ...walletEarning})
                                
            
                            })
                            .catch((error) => {
                                console.log(error)
                                res.send({error: "could not process"})
                            })
            
                        })
                        .catch((error) => {
                            console.log(error)
                            res.send({error: "could not process"})
                        })
                        
                        
                    })

                // !!============================================
                })
                .catch((error) => {
                    console.log(error)
                    res.send({error: "could not process"})
                })

            })
            .catch((error) => {
                console.log(error)
                res.send({error: "could not process"})
            })
            
            
        })

    })
    .catch((error) => {
        console.log(error)
    })

})


server.listen(PORT, () => {
    console.log(`Central server up and running at port ${ PORT }!!`)
})
