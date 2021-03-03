const path = require('path')
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});
const express = require("express")
const app = express()  
const axios = require("axios")
const cors = require("cors")
const http = require("http")
const server = http.createServer(app)
const socketIo = require("socket.io")
const io = socketIo(server, { cors: {
    origin: "http://taxiconnectna.com",
    methods: ["GET", "POST"],
    credentials: true
    }
})

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
        console.log(current.date_time)
        console.log(startOfToday)
        
        console.log(`today start: ${convertToday}`)
        console.log(`received date: ${current.date_time}`)
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

            console.log(statistics)

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
                console.log(feedback.data)

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
    
    // Get Deliveries (in progress and completed)
    socket.on("getDeliveryOverview", function(data) {
        if ((data !== undefined) && (data != null ) ) {
            console.log(`getDeliveryOverview emitted: ${data}`)
            axios.get(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/delivery-overview`)
            .then((feedback) => {
                let deliveryOverview = feedback.data
                console.log(feedback.data)

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

                    console.log(feedback.data)

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

        if ((data !== undefined) && (data != null)) {
            console.log("Authenticating...")
            console.log(data)

            try {

                axios.post(`${process.env.ROOT_URL}:${process.env.STATS_ROOT}/authenticate-owner`, data)
                .then((feedback) => {

                    console.log(feedback.data)

                    socket.emit("authenticate-response", feedback.data)

                }).catch((error) => {
                    console.log(error)               
                })
            } catch (error) {
                console.log(error)
            }
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
    // Get the Passenger list
    
    

})

server.listen(PORT, () => {
    console.log(`Central server up and running at port ${ PORT }!!`)
})
