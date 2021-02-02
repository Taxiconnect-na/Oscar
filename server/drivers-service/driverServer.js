require("dotenv").config()
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
PORT = process.env.PORT || 5556

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




clientMongo.connect(function(err) {
    //if (err) throw err
    console.log("Successful connection to Database")

    const dbMongo = clientMongo.db(dbName)
    const collectionDrivers_profiles = dbMongo.collection(
        "drivers_profiles"
    )
    // Initialize the driver list variable
    let driverDataList

    collectionDrivers_profiles.find({}).toArray()
    .then((result) => {
        driverDataList = result
        console.log(driverDataList)
    }).catch((error) => {
        console.log(error)
    })

    app.get("/driver-data", (req, res) => {
        let response = res
        response.json(driverDataList)
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
            })
        ]) 
        .then( (result) => {

            [driverFingerprint, car_fingerprint] = result

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
                identification: {
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
                    }
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
                }                    

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
    console.log("Driver server up and running")
})