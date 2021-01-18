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

const PORT = process.env.PORT || 5558

io.on("connection", (socket) => {
    // Confirm a connection
    console.log("New client connection")

    // statistics event listener
    socket.on('statistics', function(data) {
        console.log('event caught from client -> ', data);
        axios.get("http://localhost:5555/statistics/")
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
                totalNewPassengerToday: feedback.data.totalNewPassengerToday
            }

            console.log(statistics)

            //response.json(statistics)
            socket.emit("statistics-response", statistics)
            
        
        }).catch((error) => {
            console.log(error)
        })
    });
    
    // Get the driver list:
    socket.on("getDrivers", function(data) {
        console.log(`getDriver event from client ${data}`)
        axios.get("http://localhost:5556/driver-data")
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
        axios.get("http://localhost:5557/passenger-data")
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
