const fs = require('fs');
const path = require('path');

// Mongodb Connection 
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb://localhost:27017"
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });
const dbName = "Taxiconnect"

// MySQL connection
var mysql = require("mysql")

// SQL connection and authentication
var con = mysql.createConnection({
    host: "127.0.0.1",
    database: "taxiconnectdb",
    user: "root",
    password: ""
    
})


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

/**
 * 
 * @param {string} ownerFingerprint : The owner_fingerprint of driver
 * @param {string} bankDetails : One string bank details
 * @param {return} resolve 
 */

function getBankDetails(ownerFingerprint, bankDetails, resolve) {

    const result_list = bankDetails.split("|")

    if (result_list.length === 5) {
        // Initialize values that will be stored in the order [name, bank, accountno,branchcode,acctype]
        let bank_details = []

        result_list.forEach((data) => {

            if (data.split(":")[1]) {
                bank_details.push(data.split(":")[1])
            } else {
                bank_details.push('null')
            }
        })

        resolve({
            owner_name_bank: bank_details[0],
            bank_name: bank_details[1],
            account_number: bank_details[2],
            branch_code: bank_details[3],
            account_type: bank_details[4],
            success: true
        })

    } else {
        resolve({
            ownerFingerprint: ownerFingerprint, bank_data: bankDetails, success: false})
    }
}


function createDriverQueryObject(name, surname, phone_number, email, password, profile_picture,
    driver_licence_doc, copy_white_paper,copy_public_permit, copy_blue_paper, 
    personal_id_number, title, bank_name, owner_name_bank, account_number, branch_number, 
    branch_name, account_type, paymentNumber, date_registered, date_updated, driverFingerprint, 
    car_brand, permit_number, taxi_number, plate_number, car_fingerprint, date_registered_car, 
    taxi_picture, resolve) {

    resolve({
        name: name,
        surname: surname,
        phone_number: phone_number,
        email: email,
        password: password,
        operation_clearances: ["Ride"],
        // If delivery, set delivery provider:
        delivery_provider: false,
        identification_data: {
            // Required files:
            profile_picture: profile_picture,
            driver_licence_doc: driver_licence_doc,
            copy_id_paper: null,
            copy_white_paper: copy_white_paper,
            copy_public_permit: copy_public_permit,
            copy_blue_paper: copy_blue_paper,
            
            blue_paper_expiration: null,
            driver_licence_expiration: null,
            // Other identification info
            personal_id_number: personal_id_number,
            title: title,
            date_updated: date_registered,
            // Default upon creation
            isAccount_verified: true,
            // Personal Banking details
            banking_details: {
                owner_name_bank: owner_name_bank,
                bank_name: bank_name,
                account_number: account_number,
                branch_number: branch_number,
                branch_name: branch_name,
                account_type: account_type? account_type: "unknown"
            },
            // Payment number
            paymentNumber: paymentNumber
        },
        date_registered: date_registered,
        date_updated: date_updated,  // to be changed upon update
        driver_fingerprint: driverFingerprint,
        
        // When false, the driver shall not have access permission to the Driver's App
        isDriverSuspended: false,    
        // Add car's data:
        cars_data: [
            {
                car_brand: car_brand,
                car_nature: "car",
                permit_number: permit_number,
                taxi_number: taxi_number,
                plate_number: plate_number,
                max_passengers: parseInt(4),
                car_fingerprint: car_fingerprint, // =====
                vehicle_type: "normalTaxiEconomy",
                category: null,
                date_registered: date_registered_car,
                date_updated: null,
                taxi_picture: taxi_picture
            },
        ],
        operational_state : {
            status: "offline",
            last_location: null,
            accepted_requests_infos: null,
            default_selected_car: {
                max_passengers: parseInt(4),
                car_fingerprint: car_fingerprint,
                vehicle_type: "normalTaxiEconomy",
                date_Selected: null
            },
            push_notification_token: null
        },


    })
}


clientMongo.connect(function(err) {
                            
    if (err) {
        console.log(err)
    } else {
        const dbMongo = clientMongo.db(dbName)
        const collectionDrivers_profiles = dbMongo.collection("drivers_profiles")

        // Initialize inserted passengers counter
        let InsertedCount = 0

        console.log("Connected to MongoDB")

        con.connect(function(err) {
            console.log("Attempting Connection to MYSQL...")
            if (err) {
                console.log(error)
            } else {
                console.log("Success -> No Connection error detected @MySQL")
                // Query all drivers
                con.query("SELECT * FROM central_taxi_profiles", function (err, resultDrivers) {
                    if (err) {
                        console.log(err)
                    } else {
                        
                        console.log(`Number of drivers found: ${resultDrivers.length}`)
                        console.log('*****************************************************')

                        // For each driver, Get associated owner data
                        resultDrivers.forEach( driver => {

                            console.log(driver["name"])
                            // Driver's direct data from central_taxi_profiles
                            const driver_owner_fingerprint = driver["owner_fingerprint"]
                            const driver_licence_doc = driver["driver_license_doc"]
                            const surname = driver["surname"]
                            const name = driver["name"]
                            const phone_number = driver["phone_number"]
                            const email = driver["email"]
                            const password = driver["password"]
                            const taxi_number = driver["taxi_number"]
                            const plate_number = driver["plate_number"]
                            const car_brand = driver["car_brand"]
                            const driver_fingerprint = driver["user_fingerprint"] //! Confirm value
                            const profile_picture = driver["user_profile"]
                            const taxi_picture = driver["taxi_picture"]
                            const date_registered = driver["date_registered"]
                            const personal_id_number = driver["personalIdNumber"]
                            const title = driver["title"]
                            const date_updated = driver["last_updated"]
                            const car_fingerprint = driver["car_fingerprint"]

                            // Get owner data 
                            
                                // Write function for this to return promise
                            con.query(`SELECT * FROM central_owners WHERE fingerprint = '${driver_owner_fingerprint}' `, 
                             function(err, ownerData) {

                                if (ownerData) {
                                    ownerData.forEach((data) => {
                                        console.log("-----fingerprint---------")
                                        console.log(data["banking_details"])

                                        //! Get banking details
                                        new Promise((outcome) => {
                                            getBankDetails(driver_owner_fingerprint, data["banking_details"], outcome)
                                        })
                                        .then((result) => {
                                        
                                            if (result.success) {
                                                console.log(result)
        
                                                //! Banking details
                                                const owner_name_bank = result["owner_name_bank"]
                                                const bank_name = result["bank_name"]
                                                const account_number = result["account_number"]
                                                const branch_name = result["branch_code"]
                                                const account_type = result["account_type"]
                                                const branch_number = result["branch_code"]
                                                
                                                // Store other info from central_owners table
                                                const copy_id_paper = data["idCopy"]
                                                const copy_white_paper = data["whitePaper"]
                                                const copy_public_permit = data["publicPermit"]
                                                const copy_blue_paper = data["bluePaper"]

                                                console.log(`${owner_name_bank} -> ${bank_name} ${copy_id_paper}`)
                                                
                                                new Promise((res) => {
                                                    CreatePaymentNumber(collectionDrivers_profiles, res)
                                                })
                                                .then((generatedPaymentNumber) => {

                                                    //Assign Payment number
                                                    const paymentNumber = generatedPaymentNumber

                                                    //Get remaining data from central_cars Table
                                                    con.query(`SELECT * FROM central_cars WHERE car_fingerprint = '${car_fingerprint}' `, 
                                                        function(err, carData) {
                                                            if(err) {
                                                                console.log(err)
                                                            } else {
                                                                if(carData[0]) {
                                                                    console.log(`${carData[0]["permitNumber"]}, ${carData[0]["date_registered"]}`)

                                                                    //!Create variables saving wanted data
                                                                    const permit_number = carData[0]["permitNumber"]
                                                                    const date_registered_car = carData[0]["date_registered"]
  
                                                                    console.log("ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")

                                                                    // Create the Query Object to be inserted into MongoDB
                                                                    new Promise((res) => {

                                                                        createDriverQueryObject(name, surname, phone_number, email, password, profile_picture,
                                                                            driver_licence_doc, copy_white_paper,copy_public_permit, copy_blue_paper, 
                                                                            personal_id_number, title, bank_name, owner_name_bank, account_number, branch_number, 
                                                                            branch_name, account_type, paymentNumber, date_registered, date_updated, driver_fingerprint, 
                                                                            car_brand, permit_number, taxi_number, plate_number, car_fingerprint, date_registered_car, 
                                                                            taxi_picture, res)
                                                                    })
                                                                    .then((finalQuery) => {

                                                                        //console.log(finalQuery)

                                                                        //InsertedCount = InsertedCount + 1
                                                                        //console.log(`Success at ${(InsertedCount/(resultDrivers.length))*100} % `)

                                                                        // Inserting Driver in MongoDB
                            
                                                                        collectionDrivers_profiles
                                                                        .updateOne(finalQuery, {$set: finalQuery}, {upsert: true})
                                                                        .then((insertOutcome) => {
                                                                            console.log(insertOutcome.result)
                                                                            // Increase counter by 1 if document inserted
                                                                            InsertedCount = insertOutcome.result.upserted? InsertedCount+1 : InsertedCount
                                                                            console.log(`------------Inserted Object: ----------`)
                                                                            console.log(finalQuery)
                                                                            console.log("========================================================================")
                                                                            console.log(`Success at ${(InsertedCount/(resultDrivers.length))*100} % `)
                                                                            console.log("========================================================================")

                                                                        })
                                                                        .catch((error) => {
                                                                            console.log(error)
                                                                        }) 

                                                                        
                                                                    })
                                                                    .catch((error) => {
                                                                        console.log(error)
                                                                    })
                                                                } else {
                                                                    console.log(`No car found @central_cars Table for driver fingerprint: ${driver_fingerprint}`)
                                                                    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

                                                                    // Save fingerprint of driverwhich will not be inserted into MongoDB
                                                                    fs.appendFile(
                                                                        "no_car_data_at_central_cars.json", 
                                                                        JSON.stringify({
                                                                            driver_fingerprint: driver_fingerprint, 
                                                                            issue: "no data @central_cars"
                                                                        }) , 
                                                                        function (err) {
                                                                        if (err) {
                                                                            console.log(err)
                                                                        }
                                                                        console.log('The "data to append" was appended to -> no_car_data_at_central_cars.json')
                                                                        console.log(`Test result:  ${(InsertedCount/(resultDrivers.length))*100} % `)
                                                                    })
                                                                }
                                                                
                                                            }
                                                        }
                                                    )


                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                })
                                        
                                            } else {
                                        
                                                // Append file creates file if does not exist. (Append Data to file)
                                                fs.appendFile("undefined_bank_accounts.json", JSON.stringify(result) , function (err) {
                                                    if (err) {
                                                        console.log(err)
                                                    }
                                                    console.log('The "data to append" was appended to file!')
                                                 })
                                            }
                                        })
                                        .catch(error => {
                                            console.error(error)
                                            resolve({error: "action not completed"})
                                        })
                                        
                                    })
                                } else {
                                    console.log(`No match found @central_owners for owner_fingerprint: ${driver_owner_fingerprint}`)
                                }
                             })
                            // Get cars's data
                                // Write function for this to return pri
                        });

                    }
                    
                }) 
        
            }
           
        })

    }

})





