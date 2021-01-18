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

    app.get("/", (req,res) => {
        let response = res
        response.send("Central Server Ready!! What are you doing here???")
    })

    app.get("/summary", (req, res) => {
        let response = res
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

            response.json(statistics)
            socket.emit("statistics", statistics)
            
        }).catch((error) => {
            console.log(error)
        })
    })

    // Get the driver list:
    app.get("/driver-list", (req, res) => {
        let response = res
        axios.get("http://localhost:5556/driver-data")
        .then((feedback) => {
            let driverList = new Object(feedback.data)
            response.json(driverList)
        }).catch((error) => {
            console.log(error)
        })

    })

    // Get the Passenger list
    app.get("/passenger-list", (req, res) => {
        let response = res 
        axios.get("http://localhost:5557/passenger-data")
        .then((feedback) => {
            let passengerList = new Object(feedback.data)
            response.json(passengerList)
        }).catch((error) => {
            console.log(error)
        })
    })

})

server.listen(PORT, () => {
    console.log(`Central server up and running!!`)
})
