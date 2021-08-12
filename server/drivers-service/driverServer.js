require('newrelic');
//console.log = function () {};
const path = require('path')
require("dotenv").config({ path: path.resolve(__dirname, '../.env')});
const express = require("express")
const fileUpload = require("express-fileupload")
const app = express()
// Import my modules
const utils = require("./utils")

const fs = require("fs")
const certFile = fs.readFileSync("./rds-combined-ca-bundle.pem");

const http = require("http")
const server = http.createServer(app)
/*const https = require("https")
const fs = require("fs")
//Options to be passed to https server
const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, "../Encryptions/key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../Encryptions/cert.pem"))
}
const server = https.createServer(sslOptions, app) */

const winston = require('winston')
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
})
/**Options:
 * logger.info("")
 * logger.warn("")
 * logger.error("")
 */


const axios = require("axios")
const helmet = require("helmet")
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient
const crypto = require("crypto")
const AWS = require('aws-sdk')

const uri = process.env.DB_URI
const dbName = process.env.DB_NAME

app.use(helmet())
app.use(cors())
app.use(fileUpload())
app.use(express.json({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
app.use(express.urlencoded({extended: true, limit: process.env.MAX_DATA_BANDWIDTH_EXPRESS}))
PORT = process.env.DRIVER_ROOT

/*
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});*/

const redis = require("redis")
const client = null /*redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})*/


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


/*
* AWS Bucket credentials
*/
/** 
 ** Normal setup with process.env variables
const BUCKET_NAME_DRIVER = process.env.BACKET_NAME_DRIVER
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ID,
    secretAccessKey: process.env.AWS_S3_SECRET
});

*/
/**
 * * Hard coded keys
 */
//! Criver Buckets to be changed (dev/production)B
//const BUCKET_NAME_DRIVER = "drivers-central-beta-aws"  //For development
const BUCKET_NAME_DRIVER = "drivers-central-aws"     //For production
const s3 = new AWS.S3({
    accessKeyId: "AKIAXVMLF7SBTB2WU72Z",
    secretAccessKey: "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"
});

/*app.get("/", (req, res) => {
    res.send("All is good at Driver server")
}) */

/**
 * 
 * @function addHours : adds a given amount of hours to a date object 
 */
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}
 //* Windhoek Date and Time
var windhoekDateTime = new Date(new Date().toUTCString()).addHours(2)
 

/** 
  * @function GenerateFingerprint()
  * Generate a unique fingerprint for a given string
*/
function GenerateFingerprint(str, encryption = false, resolve) {

    const description = "TAXICONNECTBASICKEYFINGERPRINTS-DRIVERS-ACCOUNTS"
    const hash = crypto.createHmac("sha512WithRSAEncryption", description)
                       .update(str)
                       .digest("hex")
    resolve(hash)
}

/**
 * 
 * @param {array} arrayData : A given array from the rides_deliveries collection
 * @param {return} resolve  : Returns an object of computed values:
 *                              {totalCash: x , totalWallet: y ,totalCashWallet: x+y}
 */

function GetCashWallet(arrayData, resolve) {
  
    let fare_array = [];
    let fare_array_cash = [];
    let fare_array_wallet = [];
    const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);
    
    arrayData.map((ride) => {
        fare_array.push(Number(ride["fare"]));

        // Get rides with CASH as payment method
        let payment_method = ride["payment_method"].toUpperCase().trim();
        if (/CASH/i.test(payment_method)) {
        // if (payment_method ==="CASH") /CASH/ makes sure of spacing
        fare_array_cash.push(Number(ride["fare"]));
        } else {
        fare_array_wallet.push(Number(ride["fare"]));
        }
    });
    
    let totalCash = Sum(fare_array_cash);
    let totalWallet = Sum(fare_array_wallet);
    let totalCashWallet = totalCash + totalWallet;
    let CashWalletObject = { totalCash, totalWallet, totalCashWallet };

    resolve(CashWalletObject)

}

/**
 * 
 * @param {collection} DriversCollection:  
 * @param {collection} FilteringCollection 
 * @param {return} resolve 
 */

function getDriversInfo(DriversCollection, FilteringCollection, resolve) {
    console.log("Runnnig getDriverinfo() function")

    redisCluster.get("drivers-list", (err, reply) => {
        console.log("Inside the client.get function")
        if(err) {
            console.log("ERROR FOUND AT REDIS DRIVERS LIST")
            console.log(err)
            //*Direct request to database, Then save in redis the output
            DriversCollection
            .find({})
            .toArray()
            .then((individualsList) => {
                let drivers = individualsList.map((individual) => {
                    return new Promise((outcome) => {
                        // Get the following:
                        const name = individual.name
                        const isDriverSuspended = individual.isDriverSuspended
                        const surname = individual.surname
                        const phone_number = individual.phone_number
                        const taxi_number = individual.cars_data[0].taxi_number
                        const plate_number = individual.cars_data[0].plate_number
                        const car_brand = individual.cars_data[0].car_brand
                        const status = individual.operational_state.status
                        const driver_fingerprint = individual.driver_fingerprint
                        const taxi_picture = individual.cars_data[0].taxi_picture
                    
                        //Query for this individual's completed rides
                        query = {
                            taxi_id: individual.driver_fingerprint,
                            isArrivedToDestination: true
                        }
                        
                        FilteringCollection
                        .find(query)
                        .toArray()
                        .then((result) => {
                            
                            const totaltrip = result.length
    
                            //Make computation to get corresponding total money made
                            new Promise((res) => {
                                GetCashWallet(result, res)
                            }).then((futuremoney) => {
                                const totalmoney = futuremoney.totalCashWallet
    
                                // Get today's data:
                                let startOfToday = new Date()
                                startOfToday.setHours(0, 0, 0, 0)
                                
                                FilteringCollection
                                .find( {
                                    taxi_id: individual.driver_fingerprint,
                                    isArrivedToDestination: true,
                                    date_requested: { $gte: startOfToday }
                                })
                                .toArray()
                                .then((todaydata) => {
                                    const todaytrip = todaydata.length
    
                                    new Promise((res) => {
                                        GetCashWallet(todaydata, res)
                                    }).then((todaymoney) => {
    
                                        const todayTotalMoney = todaymoney.totalCashWallet
    
                                        // Initialize Individual data
                                        let Individual_driver = {}
    
                                        // Append data to the Individual driver Object:
                                        Individual_driver.name = name
                                        Individual_driver.surname = surname
                                        Individual_driver.phone_number = phone_number
                                        Individual_driver.taxi_number = taxi_number
                                        Individual_driver.taxi_picture = taxi_picture
                                        Individual_driver.plate_number = plate_number
                                        Individual_driver.car_brand = car_brand
                                        Individual_driver.status = status
                                        Individual_driver.driver_fingerprint = driver_fingerprint
                                        Individual_driver.totaltrip = totaltrip
                                        Individual_driver.totalmoney = totalmoney
                                        Individual_driver.todaytrip = todaytrip
                                        Individual_driver.totalMoneyToday = todayTotalMoney
                                        Individual_driver.isDriverSuspended = isDriverSuspended
    
                                        // Append this driver's info to the drivers list
                                        outcome(Individual_driver)
    
    
                                    }).catch((error) => {
                                        console.log(error)
                                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                                    })
    
                                }).catch((error) => {
                                    console.log(error)
                                    resolve({ response: "error", flag: "Invalid_params_maybe" })
                                })                        
    
                            }).catch((error) => {
                                console.log(error)
                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                                
                            })
    
                            
                        }).catch((error) => {
                            console.log(error)
                            resolve({ response: "error", flag: "Invalid_params_maybe" })
                        })
                    })
                })
                Promise.all(drivers).then(
                    (result) => {
                        redisCluster.set("drivers-list", JSON.stringify(result), redis.print)
                        resolve(result)
                    },
                    (error) => {
                        console.log(error)
                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                    }
                )
            }).catch((error) => {
                console.log(error)
            })  
        } else if(reply) {
            if(reply !== null) {
                //* Resolve found result
                resolve(JSON.parse(reply))
                //!! Update cash but do not resolve anything:
                console.log("updating driver list cache...")
                //*Update result @background in redis from Mongo with a new Promise
                new Promise((unreturned) => {
                    DriversCollection
                    .find({})
                    .toArray()
                    .then((individualsList) => {
                        let drivers = individualsList.map((individual) => {
                            return new Promise((outcome) => {
                                // Get the following:
                                const name = individual.name
                                const isDriverSuspended = individual.isDriverSuspended
                                const surname = individual.surname
                                const phone_number = individual.phone_number
                                const taxi_number = individual.cars_data[0].taxi_number
                                const plate_number = individual.cars_data[0].plate_number
                                const car_brand = individual.cars_data[0].car_brand
                                const status = individual.operational_state.status
                                const driver_fingerprint = individual.driver_fingerprint
                                const taxi_picture = individual.cars_data[0].taxi_picture
                            
                                //Query for this individual's completed rides
                                query = {
                                    taxi_id: individual.driver_fingerprint,
                                    isArrivedToDestination: true
                                }
                                
                                FilteringCollection
                                .find(query)
                                .toArray()
                                .then((result) => {
                                    
                                    const totaltrip = result.length
            
                                    //Make computation to get corresponding total money made
                                    new Promise((res) => {
                                        GetCashWallet(result, res)
                                    }).then((futuremoney) => {
                                        const totalmoney = futuremoney.totalCashWallet
            
                                        // Get today's data:
                                        let startOfToday = new Date()
                                        startOfToday.setHours(0, 0, 0, 0)
                                        
                                        FilteringCollection
                                        .find( {
                                            taxi_id: individual.driver_fingerprint,
                                            isArrivedToDestination: true,
                                            date_requested: { $gte: startOfToday }
                                        })
                                        .toArray()
                                        .then((todaydata) => {
                                            const todaytrip = todaydata.length
            
                                            new Promise((res) => {
                                                GetCashWallet(todaydata, res)
                                            }).then((todaymoney) => {
            
                                                const todayTotalMoney = todaymoney.totalCashWallet
            
                                                // Initialize Individual data
                                                let Individual_driver = {}
            
                                                // Append data to the Individual driver Object:
                                                Individual_driver.name = name
                                                Individual_driver.surname = surname
                                                Individual_driver.phone_number = phone_number
                                                Individual_driver.taxi_number = taxi_number
                                                Individual_driver.taxi_picture = taxi_picture
                                                Individual_driver.plate_number = plate_number
                                                Individual_driver.car_brand = car_brand
                                                Individual_driver.status = status
                                                Individual_driver.driver_fingerprint = driver_fingerprint
                                                Individual_driver.totaltrip = totaltrip
                                                Individual_driver.totalmoney = totalmoney
                                                Individual_driver.todaytrip = todaytrip
                                                Individual_driver.totalMoneyToday = todayTotalMoney
                                                Individual_driver.isDriverSuspended = isDriverSuspended
            
                                                // Append this driver's info to the drivers list
                                                outcome(Individual_driver)
            
            
                                            }).catch((error) => {
                                                console.log(error)
                                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                                            })
            
                                        }).catch((error) => {
                                            console.log(error)
                                            resolve({ response: "error", flag: "Invalid_params_maybe" })
                                        })                        
            
                                    }).catch((error) => {
                                        console.log(error)
                                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                                        
                                    })
            
                                    
                                }).catch((error) => {
                                    console.log(error)
                                    resolve({ response: "error", flag: "Invalid_params_maybe" })
                                })
                            })
                        })
                        Promise.all(drivers).then(
                            (result) => {
                                redisCluster.set("drivers-list", JSON.stringify(result), redis.print)
                                //resolve(result)
                            },
                            (error) => {
                                console.log(error)
                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                            }
                        )
                    }).catch((error) => {
                        console.log(error)
                    })
                })
                
            } else{
                console.log("NO CACHE FOUND FOR DRIVERS LIST")
                //* Direct request to Mongo, Then save result
                DriversCollection
                .find({})
                .toArray()
                .then((individualsList) => {
                    let drivers = individualsList.map((individual) => {
                        return new Promise((outcome) => {
                            // Get the following:
                            const name = individual.name
                            const isDriverSuspended = individual.isDriverSuspended
                            const surname = individual.surname
                            const phone_number = individual.phone_number
                            const taxi_number = individual.cars_data[0].taxi_number
                            const plate_number = individual.cars_data[0].plate_number
                            const car_brand = individual.cars_data[0].car_brand
                            const status = individual.operational_state.status
                            const driver_fingerprint = individual.driver_fingerprint
                            const taxi_picture = individual.cars_data[0].taxi_picture
                        
                            //Query for this individual's completed rides
                            query = {
                                taxi_id: individual.driver_fingerprint,
                                isArrivedToDestination: true
                            }
                            
                            FilteringCollection
                            .find(query)
                            .toArray()
                            .then((result) => {
                                
                                const totaltrip = result.length
        
                                //Make computation to get corresponding total money made
                                new Promise((res) => {
                                    GetCashWallet(result, res)
                                }).then((futuremoney) => {
                                    const totalmoney = futuremoney.totalCashWallet
        
                                    // Get today's data:
                                    let startOfToday = new Date()
                                    startOfToday.setHours(0, 0, 0, 0)
                                    
                                    FilteringCollection
                                    .find( {
                                        taxi_id: individual.driver_fingerprint,
                                        isArrivedToDestination: true,
                                        date_requested: { $gte: startOfToday }
                                    })
                                    .toArray()
                                    .then((todaydata) => {
                                        const todaytrip = todaydata.length
        
                                        new Promise((res) => {
                                            GetCashWallet(todaydata, res)
                                        }).then((todaymoney) => {
        
                                            const todayTotalMoney = todaymoney.totalCashWallet
        
                                            // Initialize Individual data
                                            let Individual_driver = {}
        
                                            // Append data to the Individual driver Object:
                                            Individual_driver.name = name
                                            Individual_driver.surname = surname
                                            Individual_driver.phone_number = phone_number
                                            Individual_driver.taxi_number = taxi_number
                                            Individual_driver.taxi_picture = taxi_picture
                                            Individual_driver.plate_number = plate_number
                                            Individual_driver.car_brand = car_brand
                                            Individual_driver.status = status
                                            Individual_driver.driver_fingerprint = driver_fingerprint
                                            Individual_driver.totaltrip = totaltrip
                                            Individual_driver.totalmoney = totalmoney
                                            Individual_driver.todaytrip = todaytrip
                                            Individual_driver.totalMoneyToday = todayTotalMoney
                                            Individual_driver.isDriverSuspended = isDriverSuspended
        
                                            // Append this driver's info to the drivers list
                                            outcome(Individual_driver)
        
        
                                        }).catch((error) => {
                                            console.log(error)
                                            resolve({ response: "error", flag: "Invalid_params_maybe" })
                                        })
        
                                    }).catch((error) => {
                                        console.log(error)
                                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                                    })                        
        
                                }).catch((error) => {
                                    console.log(error)
                                    resolve({ response: "error", flag: "Invalid_params_maybe" })
                                    
                                })
        
                                
                            }).catch((error) => {
                                console.log(error)
                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                            })
                        })
                    })
                    Promise.all(drivers).then(
                        (result) => {
                            redisCluster.set("drivers-list", JSON.stringify(result), redis.print)
                            resolve(result)
                        },
                        (error) => {
                            console.log(error)
                            resolve({ response: "error", flag: "Invalid_params_maybe" })
                        }
                    )
                }).catch((error) => {
                    console.log(error)
                })
            }
        } else {
            //*Direct request to database, Then save in redis the output
            DriversCollection
            .find({})
            .toArray()
            .then((individualsList) => {
                let drivers = individualsList.map((individual) => {
                    return new Promise((outcome) => {
                        // Get the following:
                        const name = individual.name
                        const isDriverSuspended = individual.isDriverSuspended
                        const surname = individual.surname
                        const phone_number = individual.phone_number
                        const taxi_number = individual.cars_data[0].taxi_number
                        const plate_number = individual.cars_data[0].plate_number
                        const car_brand = individual.cars_data[0].car_brand
                        const status = individual.operational_state.status
                        const driver_fingerprint = individual.driver_fingerprint
                        const taxi_picture = individual.cars_data[0].taxi_picture
                    
                        //Query for this individual's completed rides
                        query = {
                            taxi_id: individual.driver_fingerprint,
                            isArrivedToDestination: true
                        }
                        
                        FilteringCollection
                        .find(query)
                        .toArray()
                        .then((result) => {
                            
                            const totaltrip = result.length
    
                            //Make computation to get corresponding total money made
                            new Promise((res) => {
                                GetCashWallet(result, res)
                            }).then((futuremoney) => {
                                const totalmoney = futuremoney.totalCashWallet
    
                                // Get today's data:
                                let startOfToday = new Date()
                                startOfToday.setHours(0, 0, 0, 0)
                                
                                FilteringCollection
                                .find( {
                                    taxi_id: individual.driver_fingerprint,
                                    isArrivedToDestination: true,
                                    date_requested: { $gte: startOfToday }
                                })
                                .toArray()
                                .then((todaydata) => {
                                    const todaytrip = todaydata.length
    
                                    new Promise((res) => {
                                        GetCashWallet(todaydata, res)
                                    }).then((todaymoney) => {
    
                                        const todayTotalMoney = todaymoney.totalCashWallet
    
                                        // Initialize Individual data
                                        let Individual_driver = {}
    
                                        // Append data to the Individual driver Object:
                                        Individual_driver.name = name
                                        Individual_driver.surname = surname
                                        Individual_driver.phone_number = phone_number
                                        Individual_driver.taxi_number = taxi_number
                                        Individual_driver.taxi_picture = taxi_picture
                                        Individual_driver.plate_number = plate_number
                                        Individual_driver.car_brand = car_brand
                                        Individual_driver.status = status
                                        Individual_driver.driver_fingerprint = driver_fingerprint
                                        Individual_driver.totaltrip = totaltrip
                                        Individual_driver.totalmoney = totalmoney
                                        Individual_driver.todaytrip = todaytrip
                                        Individual_driver.totalMoneyToday = todayTotalMoney
                                        Individual_driver.isDriverSuspended = isDriverSuspended
    
                                        // Append this driver's info to the drivers list
                                        outcome(Individual_driver)
    
    
                                    }).catch((error) => {
                                        console.log(error)
                                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                                    })
    
                                }).catch((error) => {
                                    console.log(error)
                                    resolve({ response: "error", flag: "Invalid_params_maybe" })
                                })                        
    
                            }).catch((error) => {
                                console.log(error)
                                resolve({ response: "error", flag: "Invalid_params_maybe" })
                                
                            })
    
                            
                        }).catch((error) => {
                            console.log(error)
                            resolve({ response: "error", flag: "Invalid_params_maybe" })
                        })
                    })
                })
                Promise.all(drivers).then(
                    (result) => {
                        redisCluster.set("drivers-list", JSON.stringify(result), redis.print)
                        resolve(result)
                    },
                    (error) => {
                        console.log(error)
                        resolve({ response: "error", flag: "Invalid_params_maybe" })
                    }
                )
            }).catch((error) => {
                console.log(error)
            })
        }
    })
}



/**
 * @function GenerateUnique : Generates a random 6 digits number which is not in the paymentNumbersList
 * @param {array} paymentNumbersList 
 * @param {return} resolve 
 */

function GenerateUnique(paymentNumbersList, resolve) {
    try {
            randomGen = Math.floor((Math.random()*1000000)+1)
        
            if (paymentNumbersList.includes(randomGen)) {
                console.log(`********************** ${random} is taken *************`)
                GenerateUnique(array, resolve)
            } else {
                resolve(randomGen)
            }
    } catch(error) {
        resolve ({error: "something went wrong"})
    }
     
}


/**
 * @function CreatePaymentNumber : Returns a random number after checking availability in DB
 * @param {collection} collectionDrivers_profiles 
 * @param {return} resolve 
 */

function CreatePaymentNumber(collectionDrivers_profiles, resolve) {

    collectionDrivers_profiles
    .find({})
    .toArray()
    .then((drivers) => {
        let driversNumber = drivers.map((driver) => {
            return new Promise((outcome) => {
                const number = driver.identification_data ? driver.identification_data.personal_id_number: null
                outcome(number)
            })
        })

        Promise.all(driversNumber)
        .then((result) => {
            console.log("Getting payment numbers...")

            new Promise((res) => {
                GenerateUnique(result, res)
            })
            .then((generated) => {
                console.log(`Generated number: ${generated}`)
                // return the generated number as a string
                resolve(generated.toString())

            }, (error) => {
                console.log(error)
                resolve({message: "error occured during generation"})
            })
            //resolve(result)
        })
        .catch((error) => {
            console.log(error)
            resolve({message: "error occured before generation"})
        })
    })
    .catch((error) => {
        console.log(error)
        resolve({message: "error occured in createPaymentNUmber func"})
    })  
}

/**
 * @function InsertcashPayment: Insert the amount due to driver from his wallet.
 *  This is basically the driver's money in his wallet that we owe him
 *  Initially drivers would come to the office to get the money from above NAD 100
 * When a driver is given his NAD100, this object is inserted                             
 * @param {collection} driversCollection 
 * @param {collection} walletTransactionsLogsCollection 
 * @param {object} query 
 * @param {number} amount 
 * @param {return} resolve 
 */

function InsertcashPayment(driversCollection,walletTransactionsLogsCollection, query, amount, resolve) {
    // Initialize transaction object
    const transaction = {}
    // make query
    driversCollection
    .findOne(query)
    .then((result) => {
        
        if(result) {
            
            const money = amount
            const user_fingerprint = result.driver_fingerprint //
            const recipient_fp = result.driver_fingerprint
            const payment_currency = "NAD" //
            const transaction_nature = "weeklyPaidDriverAutomatic"
            const date_captured = (new Date()).addHours(2)
            const timestamp = ((new Date()).addHours(2)).getTime()

            transaction.user_fingerprint = user_fingerprint
            transaction.transaction_fp = result.driver_fingerprint + ((new Date()).addHours(2)).getTime()
            transaction.payment_currency = payment_currency //
            transaction.transaction_nature = transaction_nature
            transaction.date_captured = date_captured
            transaction.timestamp = timestamp
            transaction.amount = money //
           
            // Insert transaction into db
            walletTransactionsLogsCollection
            .insertOne(transaction)
            .then((next) => {
                resolve(`++++++++++++ ONE CASH PAYMENT OF [  N$ ${amount}  ] BY ${result.name} inserted ++++++++++++++++`)
            })
            .catch((error) => {
                console.log(error)
                resolve({error: "Seems like wrong parameters @db query"})
            })
        } else {
            resolve({error: "driver not found"})
        }

    })
    .catch((error) => {
        console.log(error)
        resolve({error: "Seems like wrong parameters"})
    })
}


/**
 * @function uploadFile: Takes is a file object and saves its name and content to AWS S3 bucket
 * @param {file} fileObject
 * @param {string} subdir : subdirectory of the bucket
 * @param {string} driverFingerPrint : generated fingerprint of the driver upon registration
 * @param {string} papercategory : category of the paper, options: white_paper, blue_paper, etc.
 */
function uploadFile (fileObject, subdir, driverFingerPrint, paperCategory, fileName, resolve) {

    console.log("UPLOADING FILE TO AWS S3 BUCKET")
    // Setting up S3 upload parameters
    const params = {
        Bucket: `${ BUCKET_NAME_DRIVER }/${ subdir }`,
        //Key: `${ driverFingerPrint }-${ paperCategory}` + "."+ fileObject.name.split('.') [fileObject.name.split('.').length - 1], // File name to be "saved as" @s3 bucket
        Key: `${ driverFingerPrint }-${ paperCategory}` + fileName,
        Body: fileObject // File data of the file object (actual object)
       
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        
        if (err) {
            console.log(err)
            resolve({error: "File upload to s3 bucket failed"})
        } else {
            console.log(`${ params.Key } successfully uploaded @ ${data.Location}`)
            resolve({success: "File upload to s3 bucket successful"})
        }
        
    })
}


function getCancelledRidesDriverEvent(
    collectionGlobalEvents, 
    collectionRidesDeliveryDataCancelled,
    collectionRidesDeliveryData,
    collectionPassengers_profiles,
    collectionDrivers_profiles,
    resolve
    ) {
        logger.info(" Runnig getCancelledRidesDriverEvent function")
        redisCluster.get("cancelled-rides-by-driver", (err, reply) => {

            if(err) {
                console.log(err)
                logger.info("An error occured at redis level")
                //*Direct request to database, Then save in redis the output
                collectionGlobalEvents
                .find({ event_name: "driver_cancelling_request"})
                .sort({date: -1})
                .limit(150)
                .toArray()
                .then((events) => {
                    //resolve(events)
        
                    //For each event, get the following:
                    const allCancelledRidesByDriver = events.map((event) => {
                        return new Promise((res1) => {
                            const request_fp = event.request_fp
                            const driver_fingerprint = event.driver_fingerprint
                            const date_cancelled = event.date
        
                            collectionRidesDeliveryDataCancelled
                            .findOne({request_fp: event.request_fp})
                            .then((cancelled) => {
                                
                                if(cancelled !== null) {//!This is when it has been cancelled by Passenger as well
                                    logger.info("cancelled ride found @cancelled rides collection")
                                    const date_requested = cancelled ? cancelled.date_requested: "not found"
                                    //const carTypeSelected = cancelled.carTypeSelected
                                    const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                    const connect_type = cancelled? cancelled.connect_type: "not found"
                                    const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                    const destination = cancelled? cancelled.destinationData.map((destination) => {
                                        return destination.suburb 
                                    }) : "not found"
                                    const fare = cancelled? cancelled.fare: "not found"
            
                                    queryPassenger = {user_fingerprint: cancelled.client_id}
                                    collectionPassengers_profiles
                                    .findOne(queryPassenger)
                                    .then((passenger) => {
                                        const passenger_name = passenger? passenger.name: "not found"
                                        const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                        // Get the driver info in case ride was accepted before cancellation
                                     
                                        collectionDrivers_profiles
                                        .findOne({driver_fingerprint: driver_fingerprint})
                                        .then((driver) => {
                                            const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                            const driver_name = driver? driver.name : "not found"
                                            const driver_phone_number = driver? driver.phone_number: "not found"
                        
                                            //Return the final object
                                            res1({
                                                date_cancelled,
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
                                                driver_phone_number,
                                                isRideExisting: false  //Ride is No longer present to be accepted by another
                                            })
                                        })
                                        .catch((error) => {
                                            console.log(error)
                                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
                                      
                                    })
                                    .catch((error) => {
                                      console.log(error)
                                      resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                    })
        
                                } else { //Ride not yet cancelled on passenger's side:
        
                                    collectionRidesDeliveryData
                                    .findOne({request_fp: event.request_fp})
                                    .then((cancelled) => {
        
                                        const date_requested = cancelled ? cancelled.date_requested: "not found"
                                        //const carTypeSelected = cancelled.carTypeSelected
                                        const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                        const connect_type = cancelled? cancelled.connect_type: "not found"
                                        const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                        const destination = cancelled? cancelled.destinationData.map((destination) => {
                                            return destination.suburb 
                                        }) : "not found"
                                        const fare = cancelled? cancelled.fare: "not found"
                
                                        queryPassenger = {user_fingerprint: cancelled.client_id}
                                        collectionPassengers_profiles
                                        .findOne(queryPassenger)
                                        .then((passenger) => {
                                            const passenger_name = passenger? passenger.name: "not found"
                                            const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                            // Get the driver info in case ride was accepted before cancellation
                                            
                                            collectionDrivers_profiles
                                            .findOne({driver_fingerprint: driver_fingerprint})
                                            .then((driver) => {
                                                const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                const driver_name = driver? driver.name : "not found"
                                                const driver_phone_number = driver? driver.phone_number: "not found"
                            
                                                //Return the final object
                                                res1({
                                                    date_cancelled,
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
                                                    driver_phone_number,
                                                    isRideExisting: true  //Ride is No longer present to be accepted by another
                                                })
                                            })
                                            .catch((error) => {
                                                console.log(error)
                                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                                            
                                        })
                                        .catch((error) => {
                                            console.log(error)
                                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
                                    })
                                    .catch((error) => {
                                        logger.error(`error: ${error.message}`)
                                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                    })
                                }
                                
                            })
                            .catch((error) => {
                                console.log(error)
                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                            })
                        })
                    })
        
                    Promise.all(allCancelledRidesByDriver)
                    .then((result) => {
                        //logger.info(result)
                        redisCluster.set("cancelled-rides-by-driver", JSON.stringify(result), redis.print)
                        resolve(result)
                    })
                    .catch((error) => {
                        logger.error(error)
                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                    })
                })
                .catch((error) => {
                    logger.error(error)
                    resolve({success: false, error: "Failed to get all events@collectionGlobalEvents query"})
                })

                
            } else if(reply) {

                if(reply !== null) {
                    //* Resolve found result
                    resolve(JSON.parse(reply))
                    //!! Update cash but do not resolve anything:
                    logger.info("updating cancelled-rides-by-driver cache")
                    //*Update result @background in redis from Mongo with a new Promise
                    new Promise((unreturned) => {
                        collectionGlobalEvents
                        .find({ event_name: "driver_cancelling_request"})
                        .sort({date: -1})
                        .limit(150)
                        .toArray()
                        .then((events) => {
                            //resolve(events)
                
                            //For each event, get the following:
                            const allCancelledRidesByDriver = events.map((event) => {
                                return new Promise((res1) => {
                                    const request_fp = event.request_fp
                                    const driver_fingerprint = event.driver_fingerprint
                                    const date_cancelled = event.date
                
                                    collectionRidesDeliveryDataCancelled
                                    .findOne({request_fp: event.request_fp})
                                    .then((cancelled) => {
                                        
                                        if(cancelled !== null) {//!This is when it has been cancelled by Passenger as well
                                            const date_requested = cancelled ? cancelled.date_requested: "not found"
                                            //const carTypeSelected = cancelled.carTypeSelected
                                            const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                            const connect_type = cancelled? cancelled.connect_type: "not found"
                                            const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                            const destination = cancelled? cancelled.destinationData.map((destination) => {
                                                return destination.suburb 
                                            }) : "not found"
                                            const fare = cancelled? cancelled.fare: "not found"
                    
                                            queryPassenger = {user_fingerprint: cancelled.client_id}
                                            collectionPassengers_profiles
                                            .findOne(queryPassenger)
                                            .then((passenger) => {
                                                const passenger_name = passenger? passenger.name: "not found"
                                                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                                // Get the driver info in case ride was accepted before cancellation
                                             
                                                collectionDrivers_profiles
                                                .findOne({driver_fingerprint: driver_fingerprint})
                                                .then((driver) => {
                                                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                    const driver_name = driver? driver.name : "not found"
                                                    const driver_phone_number = driver? driver.phone_number: "not found"
                                
                                                    //Return the final object
                                                    res1({
                                                        date_cancelled,
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
                                                        driver_phone_number,
                                                        isRideExisting: false  //Ride is No longer present to be accepted by another
                                                    })
                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                    resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                                })
                                              
                                            })
                                            .catch((error) => {
                                              console.log(error)
                                              resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                
                                        } else { //Ride not yet cancelled on passenger's side:
                
                                            collectionRidesDeliveryData
                                            .findOne({request_fp: event.request_fp})
                                            .then((cancelled) => {
                
                                                const date_requested = cancelled ? cancelled.date_requested: "not found"
                                                //const carTypeSelected = cancelled.carTypeSelected
                                                const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                                const connect_type = cancelled? cancelled.connect_type: "not found"
                                                const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                                const destination = cancelled? cancelled.destinationData.map((destination) => {
                                                    return destination.suburb 
                                                }) : "not found"
                                                const fare = cancelled? cancelled.fare: "not found"
                        
                                                queryPassenger = {user_fingerprint: cancelled.client_id}
                                                collectionPassengers_profiles
                                                .findOne(queryPassenger)
                                                .then((passenger) => {
                                                    const passenger_name = passenger? passenger.name: "not found"
                                                    const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                                    // Get the driver info in case ride was accepted before cancellation
                                                    
                                                    collectionDrivers_profiles
                                                    .findOne({driver_fingerprint: driver_fingerprint})
                                                    .then((driver) => {
                                                        const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                        const driver_name = driver? driver.name : "not found"
                                                        const driver_phone_number = driver? driver.phone_number: "not found"
                                    
                                                        //Return the final object
                                                        res1({
                                                            date_cancelled,
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
                                                            driver_phone_number,
                                                            isRideExisting: true  //Ride is No longer present to be accepted by another
                                                        })
                                                    })
                                                    .catch((error) => {
                                                        console.log(error)
                                                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                                    })
                                                    
                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                    resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                                })
                                            })
                                            .catch((error) => {
                                                logger.error(`error: ${error.message}`)
                                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                                        }
                                        
                                    })
                                    .catch((error) => {
                                        console.log(error)
                                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                    })
                                })
                            })
                
                            Promise.all(allCancelledRidesByDriver)
                            .then((result) => {
                                //logger.info(result)
                                redisCluster.set("cancelled-rides-by-driver", JSON.stringify(result), redis.print)
                                //resolve(result)
                            })
                            .catch((error) => {
                                logger.error(error)
                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                            })
                        })
                        .catch((error) => {
                            logger.error(error)
                            resolve({success: false, error: "Failed to get all events@collectionGlobalEvents query"})
                        })
                    })

                } else{
                    //* Direct request to Mongo, Then save result
                    collectionGlobalEvents
                    .find({ event_name: "driver_cancelling_request"})
                    .sort({date: -1})
                    .limit(150)
                    .toArray()
                    .then((events) => {
                        //resolve(events)
            
                        //For each event, get the following:
                        const allCancelledRidesByDriver = events.map((event) => {
                            return new Promise((res1) => {
                                const request_fp = event.request_fp
                                const driver_fingerprint = event.driver_fingerprint
                                const date_cancelled = event.date
            
                                collectionRidesDeliveryDataCancelled
                                .findOne({request_fp: event.request_fp})
                                .then((cancelled) => {
                                    
                                    if(cancelled !== null) {//!This is when it has been cancelled by Passenger as well
                                        const date_requested = cancelled ? cancelled.date_requested: "not found"
                                        //const carTypeSelected = cancelled.carTypeSelected
                                        const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                        const connect_type = cancelled? cancelled.connect_type: "not found"
                                        const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                        const destination = cancelled? cancelled.destinationData.map((destination) => {
                                            return destination.suburb 
                                        }) : "not found"
                                        const fare = cancelled? cancelled.fare: "not found"
                
                                        queryPassenger = {user_fingerprint: cancelled.client_id}
                                        collectionPassengers_profiles
                                        .findOne(queryPassenger)
                                        .then((passenger) => {
                                            const passenger_name = passenger? passenger.name: "not found"
                                            const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                            // Get the driver info in case ride was accepted before cancellation
                                         
                                            collectionDrivers_profiles
                                            .findOne({driver_fingerprint: driver_fingerprint})
                                            .then((driver) => {
                                                const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                const driver_name = driver? driver.name : "not found"
                                                const driver_phone_number = driver? driver.phone_number: "not found"
                            
                                                //Return the final object
                                                res1({
                                                    date_cancelled,
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
                                                    driver_phone_number,
                                                    isRideExisting: false  //Ride is No longer present to be accepted by another
                                                })
                                            })
                                            .catch((error) => {
                                                console.log(error)
                                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                                          
                                        })
                                        .catch((error) => {
                                          console.log(error)
                                          resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
            
                                    } else { //Ride not yet cancelled on passenger's side:
            
                                        collectionRidesDeliveryData
                                        .findOne({request_fp: event.request_fp})
                                        .then((cancelled) => {
            
                                            const date_requested = cancelled ? cancelled.date_requested: "not found"
                                            //const carTypeSelected = cancelled.carTypeSelected
                                            const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                            const connect_type = cancelled? cancelled.connect_type: "not found"
                                            const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                            const destination = cancelled? cancelled.destinationData.map((destination) => {
                                                return destination.suburb 
                                            }) : "not found"
                                            const fare = cancelled? cancelled.fare: "not found"
                    
                                            queryPassenger = {user_fingerprint: cancelled.client_id}
                                            collectionPassengers_profiles
                                            .findOne(queryPassenger)
                                            .then((passenger) => {
                                                const passenger_name = passenger? passenger.name: "not found"
                                                const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                                // Get the driver info in case ride was accepted before cancellation
                                                
                                                collectionDrivers_profiles
                                                .findOne({driver_fingerprint: driver_fingerprint})
                                                .then((driver) => {
                                                    const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                    const driver_name = driver? driver.name : "not found"
                                                    const driver_phone_number = driver? driver.phone_number: "not found"
                                
                                                    //Return the final object
                                                    res1({
                                                        date_cancelled,
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
                                                        driver_phone_number,
                                                        isRideExisting: true  //Ride is No longer present to be accepted by another
                                                    })
                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                    resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                                })
                                                
                                            })
                                            .catch((error) => {
                                                console.log(error)
                                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                                        })
                                        .catch((error) => {
                                            logger.error(`error: ${error.message}`)
                                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
                                    }
                                    
                                })
                                .catch((error) => {
                                    console.log(error)
                                    resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                })
                            })
                        })
            
                        Promise.all(allCancelledRidesByDriver)
                        .then((result) => {
                            //logger.info(result)
                            redisCluster.set("cancelled-rides-by-driver", JSON.stringify(result), redis.print)
                            resolve(result)
                        })
                        .catch((error) => {
                            logger.error(error)
                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                        })
                    })
                    .catch((error) => {
                        logger.error(error)
                        resolve({success: false, error: "Failed to get all events@collectionGlobalEvents query"})
                    })
                }

            } else {
                //*Direct request to database, Then save in redis the output

                collectionGlobalEvents
                .find({ event_name: "driver_cancelling_request"})
                .sort({date: -1})
                .limit(150)
                .toArray()
                .then((events) => {
                    //resolve(events)
        
                    //For each event, get the following:
                    const allCancelledRidesByDriver = events.map((event) => {
                        return new Promise((res1) => {
                            const request_fp = event.request_fp
                            const driver_fingerprint = event.driver_fingerprint
                            const date_cancelled = event.date
        
                            collectionRidesDeliveryDataCancelled
                            .findOne({request_fp: event.request_fp})
                            .then((cancelled) => {
                                
                                if(cancelled !== null) {//!This is when it has been cancelled by Passenger as well
                                    const date_requested = cancelled ? cancelled.date_requested: "not found"
                                    //const carTypeSelected = cancelled.carTypeSelected
                                    const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                    const connect_type = cancelled? cancelled.connect_type: "not found"
                                    const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                    const destination = cancelled? cancelled.destinationData.map((destination) => {
                                        return destination.suburb 
                                    }) : "not found"
                                    const fare = cancelled? cancelled.fare: "not found"
            
                                    queryPassenger = {user_fingerprint: cancelled.client_id}
                                    collectionPassengers_profiles
                                    .findOne(queryPassenger)
                                    .then((passenger) => {
                                        const passenger_name = passenger? passenger.name: "not found"
                                        const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                        // Get the driver info in case ride was accepted before cancellation
                                     
                                        collectionDrivers_profiles
                                        .findOne({driver_fingerprint: driver_fingerprint})
                                        .then((driver) => {
                                            const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                            const driver_name = driver? driver.name : "not found"
                                            const driver_phone_number = driver? driver.phone_number: "not found"
                        
                                            //Return the final object
                                            res1({
                                                date_cancelled,
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
                                                driver_phone_number,
                                                isRideExisting: false  //Ride is No longer present to be accepted by another
                                            })
                                        })
                                        .catch((error) => {
                                            console.log(error)
                                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
                                      
                                    })
                                    .catch((error) => {
                                      console.log(error)
                                      resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                    })
        
                                } else { //Ride not yet cancelled on passenger's side:
        
                                    collectionRidesDeliveryData
                                    .findOne({request_fp: event.request_fp})
                                    .then((cancelled) => {
        
                                        const date_requested = cancelled ? cancelled.date_requested: "not found"
                                        //const carTypeSelected = cancelled.carTypeSelected
                                        const passengers_number = cancelled? cancelled.passengers_number: "not found"
                                        const connect_type = cancelled? cancelled.connect_type: "not found"
                                        const origin = cancelled? cancelled.pickup_location_infos.suburb: "not found"
                                        const destination = cancelled? cancelled.destinationData.map((destination) => {
                                            return destination.suburb 
                                        }) : "not found"
                                        const fare = cancelled? cancelled.fare: "not found"
                
                                        queryPassenger = {user_fingerprint: cancelled.client_id}
                                        collectionPassengers_profiles
                                        .findOne(queryPassenger)
                                        .then((passenger) => {
                                            const passenger_name = passenger? passenger.name: "not found"
                                            const passenger_phone_number = passenger? passenger.phone_number: "not found"
                                            // Get the driver info in case ride was accepted before cancellation
                                            
                                            collectionDrivers_profiles
                                            .findOne({driver_fingerprint: driver_fingerprint})
                                            .then((driver) => {
                                                const taxi_number = driver? driver.cars_data[0]["taxi_number"] : "not found"
                                                const driver_name = driver? driver.name : "not found"
                                                const driver_phone_number = driver? driver.phone_number: "not found"
                            
                                                //Return the final object
                                                res1({
                                                    date_cancelled,
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
                                                    driver_phone_number,
                                                    isRideExisting: true  //Ride is No longer present to be accepted by another
                                                })
                                            })
                                            .catch((error) => {
                                                console.log(error)
                                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                            })
                                            
                                        })
                                        .catch((error) => {
                                            console.log(error)
                                            resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                        })
                                    })
                                    .catch((error) => {
                                        logger.error(`error: ${error.message}`)
                                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                                    })
                                }
                                
                            })
                            .catch((error) => {
                                console.log(error)
                                resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                            })
                        })
                    })
        
                    Promise.all(allCancelledRidesByDriver)
                    .then((result) => {
                        //logger.info(result)
                        redisCluster.set("cancelled-rides-by-driver", JSON.stringify(result), redis.print)
                        resolve(result)
                    })
                    .catch((error) => {
                        logger.error(error)
                        resolve({success: false, error: "Failed @getAllCancelled rides function level"})
                    })
                })
                .catch((error) => {
                    logger.error(error)
                    resolve({success: false, error: "Failed to get all events@collectionGlobalEvents query"})
                })
            }
        })

    }





MongoClient.connect(
    uri,
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
    if (err) {console.log(err)}
    console.log("Successful connection to Database")

    const dbMongo = clientMongo.db(dbName)
    const collectionDrivers_profiles = dbMongo.collection(
        "drivers_profiles"
    )
    const collectionRidesDeliveryData = dbMongo.collection(
        "rides_deliveries_requests"
    )
    const collectionWallet_transaction_logs = dbMongo.collection(
        "wallet_transactions_logs"
    )
    const collectionGlobalEvents = dbMongo.collection(
        "global_events"
    )
    const collectionPassengers_profiles = dbMongo.collection(
        "passengers_profiles"
      );
      
    const collectionRidesDeliveryDataCancelled = dbMongo.collection(
    "cancelled_rides_deliveries_requests"
    );

    const collectionRefferalsInformationGlobal = dbMongo.collection(
        "referrals_information_global"
    )
    /*
    collectionDrivers_profiles.find({}).toArray()
    .then((result) => {
        driverDataList = result
        console.log(driverDataList)
    }).catch((error) => {
        console.log(error)
    }) */

    /**
     * Socket test API
     */

    app.get("/socket-test", (req, res) => {
        console.log("Socket test API called at driver service ")

        res.json({success: true, failure: false})
    })

    /**
     * API responsible to return drivers list
     */
    app.get("/driver-data", (req, res) => {
        console.log("Driver's Data API called")
        let response = res
        new Promise((res) => {
            getDriversInfo(collectionDrivers_profiles, collectionRidesDeliveryData, res)
        }).then((result) => {
            let driverDataList = result
            
            //console.log(result)
            response.json(driverDataList)
        }).catch((error) => {
            console.log(error)
            response.json({"error": "something went wrong. Maybe no connection or wrong parameters"})
        })
    })

    /**
     * API serving to insert a payment made by a driver/owner given taxi_number,
     */
    app.post("/cash-payment", (req, res) => {
        const query_taxi_number = req.body.taxi_number? {"cars_data.taxi_number": req.body.taxi_number} : ""
        const query_paymentNumber = req.body.paymentNumber? {"identification_data.paymentNumber": req.body.paymentNumber}: ""
        const received_amount = req.body.amount

        if (query_taxi_number) {

            new Promise((res) => {
                InsertcashPayment(
                    collectionDrivers_profiles,
                    collectionWallet_transaction_logs,
                    query_taxi_number,
                    received_amount,
                    res
                )
             })
             .then((result) => {
                 // Verify returned object from InsertCashPayment
                 if (!result.error) {
                    console.log("-------------DONE-----------------------")
                    console.log(result)
                    res.json({success: "SUCCESSFUL INSERTION"})
                 } else {
                     res.status(500).send({error: "no match for provided taxi number" })
                 }

             })
             .catch((error) => {
                 console.log(error)
                 res.status(500).send({"error": "Something went wrong"})
             })
        } else if (query_paymentNumber) {

            new Promise((res) => {
                InsertcashPayment(
                    collectionDrivers_profiles,
                    collectionWallet_transaction_logs,
                    query_paymentNumber,
                    received_amount,
                    res
                )
             })
             .then((result) => {
                if (!result.error) {
                    console.log("-------------DONE-----------------------")
                    console.log(result)
                    res.json({success: "SUCCESSFUL INSERTION"})
                 } else {
                    res.status(500).send({error: "no match for provided payment number" })
                 }
             })
             .catch((error) => {
                 console.log(error)
                 res.status(500).send({error: "Something went wrong"})
             })
        } else {
            res.status(500).send({error: "Something went wrong!!"})
        }

    })
    
    //* Driver Commission payment 
    app.post("/driver-commission-payment", (req, res) => {
        console.log("DRIVER-COMMISSION-PAYMENT API CALLED")

        new Promise((res) => {
            utils.MakePaymentCommissionTCSubtracted(
                collectionWallet_transaction_logs,
                req.body.driver_fingerprint,
                Number(req.body.amount),
                res
            )
        })
        .then((result) => {
            if(result.error) {
                res.status(500).send({error: "Oops! something went wrong at server driver db function insert level"})
            }

            //*update driver cash and send success

            new Promise((updateDriverCash) => {
                axios.get(`http:172.31.16.195:9696/getDrivers_walletInfosDeep?user_fingerprint=${req.body.driver_fingerprint}&transactionData=true&avoidCached_data=true`)
                .then((data) => {
                    console.log(data.data)
                })
                .catch((error) => {
                    console.log(error)
                })
            })
            .then((res) => {
                // Do nothing
            })
            .catch((error) => {
                logger.warn(" Failed to update DriverCash @http:172.31.16.195:9696/getDrivers_walletInfosDeep?user_fingerprint=")
            })

            res.status(201).send({ success: `Payment inserted of ${req.body.amount}`})
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Oops! something went wrong at server"})
        })
    })

    // Upload Endpoint for driver registration
    app.post('/upload', (req, res) => {
        /*if (req.files === null || req.files === undefined) {
            return res.status(400).json({ msg: 'No file uploaded'})
        }*/
        
        //console.log(req.files)
        console.log("------------------------------------------------------------")
        console.log("------------------------------------------------------------")
        console.log(req.body)
        //! Files: (Temporarily removed)
        /*const profile_picture = req.files.profile_picture
        const driver_licence_doc = req.files.driver_licence_doc
        const copy_id_paper = req.files.copy_id_paper
        const copy_white_paper = req.files.copy_white_paper
        const copy_public_permit = req.files.copy_public_permit
        const copy_blue_paper = req.files.copy_blue_paper
        const taxi_picture = req.files.taxi_picture */
        
    
        if (req.body.delivery_provider.length === 0) {
            console.log("No delivery provider")
        } else {
            console.log("Delivery provider present")
        }
        

        /*
        * Local setup to save files locally (replaced by s3 bucket for production)
        const savedFiles = {}
        profile_picture.mv(path.join(__dirname,
            `./uploads/${profile_picture.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err) 
                return res.status(500).send(err)
            } else {
                savedFiles.driver_licence_doc = "Profile picture"
            }
            
        })
        driver_licence_doc.mv(path.join(__dirname,
            `./uploads/${driver_licence_doc.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err) 
                return res.status(500).send(err)
            } else {
                savedFiles.driver_licence_doc = "Driver licence"
            }
            
        })
        copy_id_paper.mv(path.join(__dirname,
            `./uploads/${copy_id_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_id_paper = "Copy ID paper"
            }
        })
        copy_white_paper.mv(path.join(__dirname,
            `./uploads/${copy_white_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_white_paper = "Copy white paper"
            }
        })
        copy_public_permit.mv(path.join(__dirname,
            `./uploads/${copy_public_permit.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_public_permit = "Copy public permit"
            }
        })
        copy_blue_paper.mv(path.join(__dirname,
            `./uploads/${copy_blue_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_blue_paper = "Copy blue paper"
            }
        })
        taxi_picture.mv(path.join(__dirname,
            `./uploads/${taxi_picture.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.taxi_picture = "Taxi picture"
            }
        })

        const UploadedFiles = {
            uploaded_files : savedFiles
        }

        */

        let fingerprintSource = req.body.name + req.body.surname + req.body.personal_id_number
        let carFingerprintSource = req.body.car_brand + req.body.plate_number + req.body.taxi_number
        // Generate a fingerprint
        let driverFingerprint
        let car_fingerprint
        Promise.all([
            new Promise((future) => {
                // Generate a fingerprint of the driver identity
                GenerateFingerprint(fingerprintSource,false, future)
                
            }),
            new Promise((future) => {
                // Generate fingerprint of the added car
                GenerateFingerprint(carFingerprintSource, false, future)
            }),
            new Promise ((future) => {
                // Generate unique payment number
                CreatePaymentNumber(collectionDrivers_profiles, future)
            }),
            
        ]) 
        .then( (result) => {

            [driverFingerprint, car_fingerprint, paymentNumber] = result

            // Driver's object to be stored in db
            let driver = {
                name: req.body.name,
                surname: req.body.surname,
                phone_number: req.body.phone_number.replace(/\s/g, ""),
                email: req.body.email,
                password: "12345678",
                operation_clearances: [req.body.operation_clearances],
                // If delivery, set delivery provider:
                delivery_provider: req.body.delivery_provider.length>0 ? req.body.delivery_provider : false,
                identification_data: {
                    // Required files:
                    profile_picture: "" ,//driverFingerprint + "-profile_picture" + "."+ req.files.profile_picture.name.split('.') [req.files.profile_picture.name.split('.').length - 1],
                    driver_licence_doc: "" ,//driverFingerprint + "-driver_licence" + "."+ req.files.driver_licence_doc.name.split('.') [req.files.driver_licence_doc.name.split('.').length - 1],
                    copy_id_paper: "" ,//driverFingerprint + "-id_paper" + "."+ req.files.copy_id_paper.name.split('.') [req.files.copy_id_paper.name.split('.').length - 1],
                    copy_white_paper: "" ,//driverFingerprint + "-white_paper" + "."+ req.files.copy_white_paper.name.split('.') [req.files.copy_white_paper.name.split('.').length - 1],
                    copy_public_permit: "" ,//driverFingerprint + "-public_permit" + "."+ req.files.copy_public_permit.name.split('.') [req.files.copy_public_permit.name.split('.').length - 1],
                    copy_blue_paper: "" ,//driverFingerprint + "-blue_paper" + "."+ req.files.copy_blue_paper.name.split('.') [req.files.copy_blue_paper.name.split('.').length - 1],
                    
                    blue_paper_expiration: new Date(req.body.blue_paper_expiration),
                    driver_licence_expiration: new Date(req.body.driver_licence_expiration),
                    // Other identification info
                    personal_id_number: req.body.personal_id_number,
                    title: req.body.title,
                    date_updated: windhoekDateTime, //(new Date()).addHours(2),
                    // Default upon creation
                    isAccount_verified: true,
                    // Personal Banking details
                    banking_details: {
                        owner_name_bank: req.body.owner_name_bank,
                        bank_name: req.body.bank_name,
                        account_number: req.body.account_number,
                        branch_number: req.body.branch_number,
                        branch_name: req.body.branch_name,
                        account_type: req.body.account_type? req.body.account_type: "unknown"
                    },
                    // Payment number
                    paymentNumber: paymentNumber
                },
                date_registered: windhoekDateTime, //(new Date()).addHours(2),
                date_updated: windhoekDateTime, //(new Date()).addHours(2),  // to be changed upon update
                driver_fingerprint: driverFingerprint,
                
                // When false, the driver shall not have access permission to the Driver's App
                isDriverSuspended: false,    
                // Add car's data:
                cars_data: [
                    {
                        car_brand: req.body.car_brand,
                        car_nature: req.body.car_nature,
                        permit_number: req.body.permit_number,
                        taxi_number: req.body.taxi_number,
                        plate_number: req.body.plate_number,
                        max_passengers: parseInt(req.body.max_passengers),
                        car_fingerprint: car_fingerprint, // =====
                        vehicle_type: req.body.vehicle_type,
                        category: req.body.category,
                        date_registered: windhoekDateTime, //(new Date()).addHours(2),
                        date_updated: windhoekDateTime, //(new Date()).addHours(2),
                        taxi_picture: "" //driverFingerprint + "-taxi_picture" + "."+ req.files.taxi_picture.name.split('.') [req.files.taxi_picture.name.split('.').length - 1]
                    },
                ],
                operational_state : {
                    status: "offline",
                    last_location: null,
                    accepted_requests_infos: null,
                    default_selected_car: {
                        max_passengers: parseInt(req.body.max_passengers),
                        car_fingerprint: car_fingerprint,
                        vehicle_type: req.body.vehicle_type,
                        date_Selected: windhoekDateTime // (new Date()).addHours(2)
                    },
                    push_notification_token: null
                },
                referral_fingerprint: req.body.referral_fingerprint? req.body.referral_fingerprint: null


            }
            // Insert object into the database
            collectionDrivers_profiles.insertOne(driver, function(err, response) {
                if (err) { 
                    console.log(err)
                    res.send({error: "Something went wrong, wrong params maybe"})
                }

                console.log("*************   New Driver Registered   ********************")
                res.send({success: "successful registration"})

            })

        }).catch((error) => {
            console.log(error)
            res.send({error: "Something went wrong, wrong params maybe"})
        })

    })

    /**
     * *UPDATE BASIC DRIVER INFORMATION
     */

    app.post("/update-driver-info", (req, res) => {

        console.log("UPDATE DRIVER INFORMATION API CALLED")

        const driverFingerPrint = req.body.driverFingerPrint
        const old_taxi_number = req.body.old_taxi_number
        const name =  req.body.name
        const surname =  req.body.surname
        const phone_number = req.body.phone_number
        const taxi_number = req.body.taxi_number
        const plate_number = req.body.plate_number
       

        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                {driver_fingerprint: driverFingerPrint, "cars_data.taxi_number": old_taxi_number},
                {
                    name: name,
                    surname: surname,
                    phone_number: phone_number,
                    "cars_data.$.taxi_number": taxi_number,
                    "cars_data.$.plate_number": plate_number,
                    "cars_data.$.date_updated": windhoekDateTime.addHours(2),
                    date_updated: windhoekDateTime.addHours(2)
                },
                res
            )
        })
        .then((update_response) => {
            
            if(update_response.error) {
                res.status(500).send({error: "Failed to update driver info data @database level"})
            } else if (update_response.success) {
                // return success message
                res.status(201).send({ success: "Driver info updated"})
            }
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update driver info data @database level"})
        })
    })

    /**
     * *UPDATE TAXI/VEHICLE PICTURE
     */
    app.post("/upload-taxi-picture", (req,res) => { 
        // BUcket location params
        const paperCategory = "taxi_picture"
        const subdirectory = "Taxi_picture"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint, "cars_data.taxi_number": req.body.taxi_number},
                { "cars_data.$.taxi_picture" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.taxi_picture_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.taxi_picture, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.taxi_picture_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The taxi picture file was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "Taxi picture updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The taxi picture file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level"})
        })
        
    })


    /**
     * *UPDATE PROFILE PICTURE
     */
     app.post("/update-profile-picture", (req,res) => {
        // BUcket location params
        const paperCategory = "profile_picture"
        const subdirectory = "Profiles_Pictures"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.profile_picture" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.profile_picture_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.profile_picture, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.profile_picture_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The taxi picture file was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "Profile picture updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The profile picture file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level profile picture"})
        })
        
    })

    
    /**
     * *UPDATE DRIVER LICENCE DOCUMENT
     */
     app.post("/update-driver-licence", (req,res) => {
        // BUcket location params
        const paperCategory = "driver_licence"
        const subdirectory = "Driver_licence"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.driver_licence_doc" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.driver_licence_doc_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.driver_licence, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.driver_licence_doc_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The driver licence document was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "Driver licence updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The driver licence document file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level driver licence"})
        })
        
    })


    /**
     * *UPDATE ID paper
     */
     app.post("/update-id-paper", (req,res) => {
        // BUcket location params
        const paperCategory = "id_paper"
        const subdirectory = "Id_paper"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.copy_id_paper" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.copy_id_paper_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level (ID paper)"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.copy_id_paper, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.copy_id_paper_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The id paper document was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "ID paper updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The ID paper document file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level ID paper"})
        })
        
    })
    


    /**
     * *UPDATE WHITE PAPER
     */
     app.post("/update-white-paper", (req,res) => {
        // BUcket location params
        const paperCategory = "white_paper"
        const subdirectory = "White_paper"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.copy_white_paper" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.copy_white_paper_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.copy_white_paper, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.copy_white_paper_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The white paper document was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "White paper updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The White paper document file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level White paper"})
        })
        
    })


    /**
     * *UPDATE PUBLIC PERMIT
     */
     app.post("/update-public-permit", (req,res) => {
        // BUcket location params
        const paperCategory = "public_permit"
        const subdirectory = "Public_permit"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.copy_public_permit" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.copy_public_permit_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.copy_public_permit, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.copy_public_permit_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The public permit document was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "Public permit updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The Public permit document file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level White paper"})
        })
        
    })


    /**
     * *UPDATE BLUE PAPER
     */
     app.post("/update-blue-paper", (req,res) => {
        // BUcket location params
        const paperCategory = "blue_paper"
        const subdirectory = "Blue_paper"

        // MongoDB insert
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                { driver_fingerprint: req.body.fingerprint},
                { "identification_data.copy_blue_paper" : `${req.body.fingerprint}-${ paperCategory }`+ req.body.copy_blue_paper_name},
                res
            )
        })
        .then((data) => {
            if(data.error) {
                res.status(500).send({error: "Failed to update data @database level"})
            } 

            // File upload to s3 
            new Promise((res) => {
                
                uploadFile(new Buffer.from(req.body.copy_blue_paper, "base64"), subdirectory, req.body.fingerprint, paperCategory, req.body.copy_blue_paper_name, res)
                
            })
            .then((data) => {
                if (data.error) {
                    // Do not register driver if error occurs during file upload
                    res.status(500).send({error: "The Blue paper document was not uploaded to s3 bucket"})

                } else {
                    res.status(201).send({ success: "Blue paper updated"})
                }
                
        
            })
            .catch((error) => {
                console.log(error)
                res.status(500).send({error: "The Blue paper document file was not uploaded to s3 bucket"})
            })

            
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to update data @promise level Blue paper"})
        })
    })


    app.get("/cancelled-rides-driver", (req, res) => {

        logger.info("cancelled-rides-driver API CALLED")
        new Promise((res) => {
            getCancelledRidesDriverEvent(
                collectionGlobalEvents,
                collectionRidesDeliveryDataCancelled,
                collectionRidesDeliveryData,
                collectionPassengers_profiles,
                collectionDrivers_profiles,
                res
            )
        })
        .then((result) => {
            //logger.info(result)
            if(result.error) {
                res.status(500).json({success: false, error: "Internal server Error"})    
            }

            res.status(200).json({success: true, data: result})

        })
        .catch((error) => {
            console.log(error)
        })
    })


    /**
     * * SUSPEND DRIVER
     */

    app.post("/suspend-driver", (req, res) => {

        logger.info("SUSPENDING DRIVER ...@suspend driver API")

        const driverFingerPrint = req.body.driverFingerPrint
        logger.info(`driver fingerprint: ${driverFingerPrint}`)
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                {driver_fingerprint: driverFingerPrint },
                {
                    isDriverSuspended: true
                },
                res
            )
        })
        .then((update_response) => {
            
            if(update_response.error) {
                res.status(500).send({error: true, message: "Failed to suspend driver @database level"})
            } else if (update_response.success) {
                // return success message
                res.status(201).send({ success: true, message: "Driver suspended"})
            }
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to suspend driver @database level"})
        })
    })

    app.post("/unsuspend-driver", (req, res) => {

        logger.info("UNSUSPENDING DRIVER ...@unsuspend driver API")

        const driverFingerPrint = req.body.driverFingerPrint
        logger.info(`driver fingerprint: ${driverFingerPrint}`)
        new Promise((res) => {
            utils.updateEntry(
                collectionDrivers_profiles,
                {driver_fingerprint: driverFingerPrint },
                {
                    isDriverSuspended: false
                },
                res
            )
        })
        .then((update_response) => {
            
            if(update_response.error) {
                res.status(500).send({error: true, message: "Failed to unsuspend driver @database level"})
            } else if (update_response.success) {
                // return success message
                res.status(201).send({ success: true, message: "Driver unsuspended"})
            }
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send({error: "Failed to unsuspend driver @database level"})
        })
    })

    /**
     * ======================================================================
     *  * REFERRALS PROGRAM RELATED APIs
     * ======================================================================
     */
    app.get("/referrals", (req, res) => {

        logger.info("GETTING REFFERALS API CALLED ")

        new Promise((res) => {
            utils.getReferrals(
                collectionRefferalsInformationGlobal,
                collectionPassengers_profiles,
                collectionDrivers_profiles,
                 res
            )
        })
        .then((referrals) => {
            if(!referrals.success){
                res.status(500).json({success: false, error: referrals.error})
            }
            res.status(200).json({success: true, data: referrals.data })
        })
        .catch((error) => {
            logger.error(error.message)
            res.status(500).json({success: false, error: error.message})

        })
    })

    app.get("/update-referral-paid-status/:referral_fingerprint", (req, res) => {

        const referral_fingerprint = req.params.referral_fingerprint

        new Promise((res) => {
            utils.updateIsReferralPaid(collectionRefferalsInformationGlobal, referral_fingerprint, res)
        })
        .then((data) => {
            logger.info(data)
            if(!data.success) {
                res.status(500).json({success: false, error: "Failed to update referral payment status"})
            }
            res.status(200).json({success: true, message: "Successfully updated referral payment status"})
        })
        .catch((error) => {
            logger.error(error.message)
            res.status(500).json({success: false, error: "< Failed to update referral payment status >"})
        })
    })

    app.get("/update-referral-rejection-status/:referral_fingerprint", (req, res) => {

        const referral_fingerprint = req.params.referral_fingerprint

        new Promise((res) => {
            utils.updateIsReferralRejected(collectionRefferalsInformationGlobal, referral_fingerprint, res)
        })
        .then((data) => {
            logger.info(data)
            if(!data.success) {
                res.status(500).json({success: false, error: "Failed to update referral rejection status"})
            }
            res.status(200).json({success: true, message: "Successfully updated referral rejection status"})
        })
        .catch((error) => {
            logger.error(error.message)
            res.status(500).json({success: false, error: "< Failed to update referral rejection status >"})
        })
    })

    app.get("/mark-referral-deleted-user-side/:referral_fingerprint", (req, res) => {

        logger.info("mark-referral-deleted-user-side API CALLED")

        const referral_fingerprint = req.params.referral_fingerprint
       
        new Promise((res) => {
            utils.updateEntry(
                collectionRefferalsInformationGlobal,
                {referral_fingerprint: referral_fingerprint },
                {
                    is_official_deleted_user_side: true
                },
                res
            )
        })
        .then((update_response) => {
            logger.info(update_response)
            if(update_response.error) {
                res.status(500).json({success: false, error: "Failed to mark referral deleted on user side"})
            } else if (update_response.success) {
                // return success message
                res.status(200).json({ success: true, message: "Successfully marked referral as deleted on user side"})
            }
        })
        .catch((error) => {
            logger.error(error.message)
            res.status(500).json({error: "< Failed to mark referral deleted on user side >"})
        })
    })

    app.get("/delete-referral/:referral_fingerprint", (req, res) => {

        logger.info("delete-referral API CALLED")

        const referral_fingerprint = req.params.referral_fingerprint
       
        new Promise((res) => {
            utils.deleteEntry(
                collectionRefferalsInformationGlobal,
                {referral_fingerprint: referral_fingerprint },
                res
            )
        })
        .then((delete_response) => {
            logger.info(delete_response)
            if(!delete_response.success) {
                res.status(500).json({success: false, error: "Failed to delete referral"})
            }
            
            res.status(200).json({success: true, message: "Successfull deletion of referral"})
        })
        .catch((error) => {
            logger.error(error.message)
            res.status(500).json({error: "< Failed to mark referral deleted on user side >"})
        })
    })

})

app.get("/test", (req, res) => {
    res.status(200).json({hasSucceeded: true, message: " Driver server up and running"})
})


server.listen(PORT, () => {
    console.log(`Driver server up and running @ port ${ PORT } `)
})

/*

{
    "_id": {
        "$oid": "60d48c19cd55e64be7cc37d0"
    },
    "referral_fingerprint": "bb8665fa3494badf9b525df33a26babc7ddfbd7929e8aaa6f9f037fb5dd3130ed535fc0bf4292b409ff17b53f9f5007c3bc0d347c396692831a726ca391e3d4f",
    "driver_name": "Max",
    "driver_phone": "264814255888",
    "taxi_number": "K080",
    "user_referrer": "48aecfa6a98979574c6db8a77fd0a9e09dd4f37b2e4811343c65d31a88c404f46169466ff0e03e46",
    "user_referrer_nature": "rider",
    "expiration_time": {
        "$date": "2021-06-26T15:43:53.000Z"
    },
    "is_referralExpired": true,
    "is_paid": true,
    "amount_paid": false,
    "amount_paid_percentage": 50,
    "is_referral_rejected": false,
    "is_official_deleted_user_side": false,
    "date_referred": {
        "$date": "2021-06-24T15:43:53.000Z"
    }
}

 */