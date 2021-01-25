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

        const UploadedFiles = {
            uploaded_files : savedFiles
        }

        let fingerprintSource = req.body.name + req.body.surname + req.body.personal_id_number

        // Generate a fingerprint
        let driverFingerprint 
        new Promise((future) => {

            GenerateFingerprint(fingerprintSource,false, future)
            
        }).then(
            (result) => {
                driverFingerprint = result

                // Driver's object to be stored in db
                let driver = {
                    name: req.body.name,
                    surname: req.body.surname,
                    phone_number: req.body.phone_number,
                    email: req.body.email,
                    password: "12345678",
                    operation_clearances: req.body.operation_clearances,
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
                    isDriverSuspended: false    

                }

                collectionDrivers_profiles.insertOne(driver, function(err, res) {
                    if (err) throw err
                    console.log("New Driver Registered")
                })
                // Return uploaded files
                res.json(UploadedFiles)
                    
            })
                    },
            (error) => {
                console.log(error)
                res.json({message: "Something went wront"})
            }
        )
        


})

app.listen(PORT, () => {
    console.log("Driver server up and running")
})

