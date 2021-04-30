//console.log = function () {};
const path = require('path')
// For self contained app
//require("dotenv").config({ path: path.resolve(__dirname, './.env')});
// For overall server
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});

const express = require("express")
const app = express()
const helmet = require("helmet")
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient

const redis = require("redis")
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const http = require("http")
/*const https = require("https")
const fs = require("fs")
//Options to be passed to https server
const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "../Encryptions/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../Encryptions/cert.pem"))
}
const server = https.createServer(sslOptions, app) */
const server = http.createServer(app)
//const { promisify } = require("util");
//const getAsync = promisify(client.get).bind(client)


const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(express.json({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(express.urlencoded({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(cors())
app.use(helmet())

const PORT = process.env.PLOT_ROOT
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
});

// For testing purpose:
app.get("/ready", (req, res) => {
    res.send({ message: "All is good at Ploting server", ready: true})
})


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
  

function getDayName(number) {
    switch(number) {
        case 0:
            return "Sun"
            break
        case 1:
            return "Mon"
            break
        case 2:
            return "Tue"
            break
        case 3:
                return "Wed"
                break
        case 4:
            return "Thu"
            break
        case 5:
            return "Fri"
            break
        case 6:
            return "Sat"
            break
        
    }
}

function GeneralPlottingData(collectionRidesDeliveryData, filteringQuery, fire ) {

    collectionRidesDeliveryData
    .find(filteringQuery)
    //.limit(6)
    .sort({date_requested: -1 })
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
                    monthDay: (data.date_requested.getMonth() + 1).toString() + "-"+ data.date_requested.getDate().toString(),
                    yearMonth: data.date_requested.getFullYear().toString() + "-" + (data.date_requested.getMonth() + 1).toString(),
                    yearMonthDay: data.date_requested.getFullYear().toString() + "-" + (data.date_requested.getMonth() + 1).toString() + "-" + data.date_requested.getDate().toString(),
                    fare: Number(data.fare),
                    payment_method: data.payment_method,
                    connect_type: data.connect_type,
                    origin_location_suburb: data.pickup_location_infos.suburb
                })
            })
            .catch((error) => {
                console.log(error)
                fire({error: "Failed to get general plotting data"})
            })
        })
        //Collect all promises and return final array of objects
        Promise.all(allObjects)
        .then((result) => {
            console.log(`General plotting data count: ${result.length}`)
            fire(result)
        })
        .catch((error) => {
            console.log(error)
            fire({error: "Failed to get general plotting data"})
        })

    })
    .catch((error) => {
        console.log(error)
        fire({error: "Failed to get general plotting data"})
    })

}

/**
 * @function MonthlyDataCount: returns monthy counts based on spicified year and grouping criteria
 * * //! Empty list is returned whenever the year is not contained in the data
 * @param {array of objects} data: Objects of the array are the ones generated by GeneralPlottingData function 
 * @param {string} filteringYear : The year for which the data should be returned
 *                   
 * @returns 
 */
function MonthlyDataCount(data, filteringYear, resolve) {
    
    let sorted = data.groupBy("yearMonth")
    //console.log(sorted)
    let sortedList = sorted.map((category) => {
        //return a promise for each object to be added to the list
        return new Promise((output) => {
            
            output({date: category.field, count: category.groupList.length})
        })
        .catch((error) => {
            console.log(error)
            resolve({error: "Failed to return the monthly list of data"})
        })

    })

    Promise.all(sortedList)
    .then((result) => {
        // return data filtered by wanted year
        let yearFilteredArray = result.filter((element) => {
            return element.date.startsWith(filteringYear)
        })

        resolve(yearFilteredArray)
    })
    .catch((error) => {
        console.log(error)
        resolve({error: "Failed to return the monthly list of data"})
    })
    
}




clientMongo.connect(function(err) {
    if (err) {
        console.log(`Error occured: ${err}`)
    } else {

        console.log("Successful connection to Database @Plot-server")

        const dbMongo = clientMongo.db(dbName)
        const collectionPassengers_profiles = dbMongo.collection(
            "passengers_profiles"
        )
        const collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
        const collectionRidesDeliveryData = dbMongo.collection(
            "rides_deliveries_requests"
        )
        const collectionRidesDeliveryDataCancelled = dbMongo.collection(
            "cancelled_rides_deliveries_requests"
        )
        

        app.get("/rides-plot-data/per-monthly-data/:year", (req, res) => {

                // Filtering query
            const query = {
                ride_mode: "RIDE",
                isArrivedToDestination: true,
                "ride_state_vars.isRideCompleted_riderSide": true,
                "ride_state_vars.isRideCompleted_driverSide": true

            }
            new Promise((fire) => {
                GeneralPlottingData(collectionRidesDeliveryData, query, fire)
            })
            .then((result) => {
                if(result.error) {
                    console.log(" An error occured @GeneralPlottingData")
                    res.send({error: "Failed to get rides monthly data @function level"})
                } else {
                    
                    new Promise((res) => {
                        MonthlyDataCount(result, req.params.year, res)
                    })
                    .then((monthly) => {
                        console.log(monthly)
                        res.send(monthly)
                    })
                }
            })
            .catch((error) => {
                console.log(error)
                res.send({error: "Failed to get rides monthly data, maybe verify your params"})
            })          
        })         
    }
    
})

server.listen(PORT, () => {
    console.log(`Plot server up and running @ port ${PORT}`)
})

