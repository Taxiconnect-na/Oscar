require("dotenv").config({ path: "../.env"});
const express = require("express")
const app = express()
const axios = require("axios")
const cors = require("cors")
const http = require("http")
const server = http.createServer(app)
const socketIo = require("socket.io")
const io = socketIo(server)

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())

const PORT = process.env.CENTRAL_PORT


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
