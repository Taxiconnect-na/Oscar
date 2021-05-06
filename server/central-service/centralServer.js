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
const socketIo = require("socket.io")
const io = socketIo(server, { cors: {
    origin: "https://taxiconnectnanetwork.com",
    //origin: "http://localhost",
    //origin: "http://192.168.8.151",
    methods: ["GET", "POST"],
    credentials: true
    }
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



function MyFormData(
    // Input data:
    name,
    surname,
    title,
    personal_id_number,
    phone_number,
    email,
    operation_clearances,
    delivery_provider,
    /*profile_picture,
    driver_licence_doc,
    copy_id_paper,
    copy_white_paper,
    copy_public_permit,
    copy_blue_paper,*/
    blue_paper_expiration,
    driver_licence_expiration,
    bank_name,
    owner_name_bank,
    account_number,
    branch_number,
    branch_name,
    car_brand,
    permit_number,
    taxi_number,
    plate_number,
    max_passengers,
    //taxi_picture,
    vehicle_type,
    car_nature,
    account_type,
    //Resolve: to be used as return for async
    resolve) {

    // Initialize formData
    const formData = new FormData()

    // Append data to formData
    formData.append('name', name)
    formData.append('surname', surname)
    formData.append('title', title)
    formData.append('personal_id_number', personal_id_number)
    formData.append('phone_number', phone_number)
    formData.append('email', email)
    //formData.append('password', password)
    formData.append('operation_clearances', operation_clearances)
    formData.append('delivery_provider', delivery_provider)
    /*
    formData.append('profile_picture', profile_picture)
    formData.append('driver_licence_doc', driver_licence_doc)
    formData.append('copy_id_paper', copy_id_paper)
    formData.append('copy_white_paper', copy_white_paper)
    formData.append('copy_public_permit', copy_public_permit)
    formData.append('copy_blue_paper', copy_blue_paper)*/
    formData.append('blue_paper_expiration', blue_paper_expiration)
    formData.append('driver_licence_expiration', driver_licence_expiration)
    formData.append('bank_name', bank_name)
    formData.append('account_number', account_number)
    formData.append('branch_number', branch_number)
    formData.append('branch_name', branch_name)
    formData.append('account_type', account_type)
    formData.append('owner_name_bank', owner_name_bank)

    /*if (formData.get('operation_clearances') === "Ride") {
        formData.set('delivery_provider', "")
    }*/

    // Car's data
    formData.append('car_brand', car_brand)
    formData.append('permit_number', permit_number)
    formData.append('taxi_number', taxi_number)
    formData.append('plate_number', plate_number)
    formData.append('max_passengers', max_passengers)
    //formData.append('taxi_picture', taxi_picture)
    formData.append('vehicle_type', vehicle_type)
    formData.append('car_nature', car_nature)

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
    /*
    // Register Driver:
    socket.on("registerDriver", function(data) {

        if ((data !== undefined) && (data !== null)) {
            console.log("Driver registration in progress driver...")
            console.log(`Received data (also printed below) -------> ${data}`)
            // View received data:
            console.log(data)
            
            new Promise((res) => {
                MyFormData(
                    // Input data:
                    data.name,
                    data.surname,
                    data.title,
                    data.personal_id_number,
                    data.phone_number,
                    data.email,
                    data.operation_clearances,
                    data.delivery_provider,
                    /*data.profile_picture,
                    data.driver_licence_doc,
                    data.copy_id_paper,
                    data.copy_white_paper,
                    data.copy_public_permit,
                    data.copy_blue_paper,
                    data.blue_paper_expiration,
                    data.driver_licence_expiration,
                    data.owner_name_bank,
                    data.bank_name,
                    data.account_number,
                    data.branch_number,
                    data.branch_name,
                    data.car_brand,
                    data.permit_number,
                    data.taxi_number,
                    data.plate_number,
                    data.max_passengers,
                    //data.taxi_picture,
                    data.vehicle_type,
                    data.car_nature,
                    data.account_type,
                    //Resolve: to be used as return for async
                    res)
            })
            .then((outputForm) => {

                try {

                    console.log(`Posting With following Driver Data ######------->> ${outputForm}`)
    
                    // Make the post request to driver's endpoint with received data
                    axios.post(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/upload`, outputForm, {
                        headers: outputForm.getHeaders()
                        /* headers: { // headers option 
                            'Content-Type': 'multipart/form-data'
                        } 
                        
                    })
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
    
                } catch (error) {
                    console.log(error)
                    socket.emit("registerDriver-response", { success: false, failure: true})
                }
            })
            .catch((error) => {
                console.log(error)
                socket.emit("registerDriver-response", { success: false, failure: true})
            })
            
        }
        //! Handled undefined and null data below with else
    }) */

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

server.listen(PORT, () => {
    console.log(`Central server up and running at port ${ PORT }!!`)
})
