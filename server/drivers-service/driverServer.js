require("dotenv").config({ path: "../.env"})
const express = require("express")
const fileUpload = require("express-fileupload")
const app = express()
const cors = require("cors")
const MongoClient = require("mongodb").MongoClient
const path = require("path")
const crypto = require("crypto")

const uri = process.env.DB_URI
const dbName = process.env.DB_NAME
app.use(cors())
app.use(fileUpload())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
PORT = process.env.DRIVER_ROOT

const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });


app.get("/", (req, res) => {
    res.send("All is good at Driver server")
})



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
 * @param {*} FilteringCollection 
 * @param {return} resolve 
 */

function getDriversInfo(DriversCollection, FilteringCollection, resolve) {

    DriversCollection
    .find({})
    .toArray()
    .then((individualsList) => {
        let drivers = individualsList.map((individual) => {
            return new Promise((outcome) => {
                // Get the following:
                const name = individual.name
                const surname = individual.surname
                const phone_number = individual.phone_number
                const taxi_number = individual.cars_data[0].taxi_number
                const plate_number = individual.cars_data[0].plate_number
                const car_brand = individual.cars_data[0].car_brand
                const status = individual.operational_state.status
             
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
                                Individual_driver.plate_number = plate_number
                                Individual_driver.car_brand = car_brand
                                Individual_driver.status = status
                                Individual_driver.totaltrip = totaltrip
                                Individual_driver.totalmoney = totalmoney
                                Individual_driver.todaytrip = todaytrip
                                Individual_driver.totalMoneyToday = todayTotalMoney

                                // Append this driver's info to the drivers list
                                outcome(Individual_driver)


                            }).catch((error) => {
                                console.log(error)
                            })

                        }).catch((error) => {
                            console.log(error)
                        })                        

                    }).catch((error) => {
                        console.log(error)
                        
                    })

                    
                }).catch((error) => {
                    console.log(error)
                })
            })
        })
        Promise.all(drivers).then(
            (result) => {
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



/**
 * @function GenerateUnique : Generates a random 6 digits number which is not in the paymentNumbersList
 * @param {array} paymentNumbersList 
 * @param {return} resolve 
 */

function GenerateUnique(paymentNumbersList, resolve) {
    try {
            randomGen = Math.floor((Math.random()*1000000)+1)
        
            if (paymentNumbersList.includes(randomGen)) {
                GenerateUnique(array, resolve)
            } else {
                resolve(randomGen)
            }
    } catch(error) {
        resolve ({error: "something went wrong"})
    }
    
}


/**
 * @function CreatePaymentNumber : Returnes a random number after checking availability in DB
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



clientMongo.connect(function(err) {
    //if (err) throw err
    console.log("Successful connection to Database")

    const dbMongo = clientMongo.db(dbName)
    const collectionDrivers_profiles = dbMongo.collection(
        "drivers_profiles"
    )
    const collectionRidesDeliveryData = dbMongo.collection(
        "rides_deliveries_requests"
    )
    

    collectionDrivers_profiles.find({}).toArray()
    .then((result) => {
        driverDataList = result
        console.log(driverDataList)
    }).catch((error) => {
        console.log(error)
    })

    app.get("/driver-data", (req, res) => {
        let response = res
        new Promise((res) => {
            getDriversInfo(collectionDrivers_profiles, collectionRidesDeliveryData, res)
        }).then((result) => {
            let driverDataList = result
            console.log("Driver's Data API called")
            console.log(result)
            response.json(driverDataList)
        }).catch((error) => {
            console.log(error)
            response.json({"error": "something went wrong. Maybe no connection or wrong parameters"})
        })
    })

        // Upload Endpoint (where we will send our requests to from the react app)
    app.post('/upload', (req, res) => {
        if (req.files === null || req.files === undefined) {
            return res.status(400).json({ msg: 'No file uploaded'})
        }
        
        console.log(req.files)
        console.log("------------------------------------------------------------")
        console.log("------------------------------------------------------------")
        console.log(req.body)
        
        const profile_picture = req.files.profile_picture
        const driver_licence_doc = req.files.driver_licence_doc
        const copy_id_paper = req.files.copy_id_paper
        const copy_white_paper = req.files.copy_white_paper
        const copy_public_permit = req.files.copy_public_permit
        const copy_blue_paper = req.files.copy_blue_paper
        const taxi_picture = req.files.taxi_picture
    
        if (req.body.delivery_provider.length === 0) {
            console.log("No delivery provider")
        } else {
            console.log("Delivery provider present")
        }
        
        const savedFiles = {}
        profile_picture.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${profile_picture.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err) 
                return res.status(500).send(err)
            } else {
                savedFiles.driver_licence_doc = "Profile picture"
            }
            
        })
        driver_licence_doc.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${driver_licence_doc.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err) 
                return res.status(500).send(err)
            } else {
                savedFiles.driver_licence_doc = "Driver licence"
            }
            
        })
        copy_id_paper.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${copy_id_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_id_paper = "Copy ID paper"
            }
        })
        copy_white_paper.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${copy_white_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_white_paper = "Copy white paper"
            }
        })
        copy_public_permit.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${copy_public_permit.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_public_permit = "Copy public permit"
            }
        })
        copy_blue_paper.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${copy_blue_paper.name}`), err => {  //mv move method on file object
            if (err) {
                console.error(err)
                return res.status(500).send(err)
            } else {
                savedFiles.copy_blue_paper = "Copy blue paper"
            }
        })
        taxi_picture.mv(path.join(__dirname,
            `../../client/adminui/public/uploads/${taxi_picture.name}`), err => {  //mv move method on file object
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
            })
        ]) 
        .then( (result) => {

            [driverFingerprint, car_fingerprint, paymentNumber] = result

            // Driver's object to be stored in db
            let driver = {
                name: req.body.name,
                surname: req.body.surname,
                phone_number: req.body.phone_number,
                email: req.body.email,
                password: "12345678",
                operation_clearances: [req.body.operation_clearances],
                // If delivery, set delivery provider:
                delivery_provider: req.body.delivery_provider.length>0 ? req.body.delivery_provider : false,
                identification_data: {
                    // Required files:
                    profile_picture: req.files.profile_picture.name,
                    driver_licence_doc: req.files.driver_licence_doc.name,
                    copy_id_paper: req.files.copy_id_paper.name,
                    copy_white_paper: req.files.copy_white_paper.name,
                    copy_public_permit: req.files.copy_public_permit.name,
                    copy_blue_paper: req.files.copy_blue_paper.name,
                    blue_paper_expiration: req.body.blue_paper_expiration,
                    driver_licence_expiration: req.body.driver_licence_expiration,
                    // Other identification info
                    personal_id_number: req.body.personal_id_number,
                    title: req.body.title,
                    date_updated: new Date(),
                    // Default upon creation
                    isAccount_verified: true,
                    // Personal Banking details
                    banking_details: {
                        bank_name: req.body.bank_name,
                        account_number: req.body.account_number,
                        branch_number: req.body.branch_number,
                        branch_name: req.body.branch_name
                    },
                    // Payment number
                    paymentNumber: paymentNumber
                },
                date_registered: new Date(),
                date_updated: new Date(),  // to be changed upon update
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
                        date_registered: new Date(),
                        date_updated: new Date(),
                        taxi_picture: req.files.taxi_picture.name
                    },
                ],
                operational_state : {
                    status: "offline",
                    last_location: null,
                    accepted_requests_infos: null,
                    default_selected_car: {
                        max_passengers: parseInt(req.body.max_passengers),
                        car_fingerprint: car_fingerprint,
                        vehicle_type: req.body.category,
                        date_Selected: new Date()
                    },
                    push_notification_token: null
                },


            }

            collectionDrivers_profiles.insertOne(driver, function(err, res) {
                if (err) throw err
                console.log("*************   New Driver Registered   ********************")
            })
            // Return uploaded files
            res.json(UploadedFiles)
           
                
        }).catch((error) => {
            console.log(error)
            res.json({message: "Oops! Something went wrong, maybe wrong input data"})
        })

    })

})

app.listen(PORT, () => {
    console.log(`Driver server up and running @ port ${ PORT } `)
})