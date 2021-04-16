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

function createPassengerQueryObject(
    name, surname, gender, fingerprint, phone_number, email,profile_pic,
    isAccount_verified, last_updated, date_updated, resolve) {

        resolve({
            name: name,
            surname: surname,
            gender: gender,
            user_fingerprint: fingerprint,
            phone_number: phone_number,
            email: email,
            password: false,
            account_state: "full",
            media: {
                profile_picture: profile_pic
            },
            account_verifications: {
                is_accountVerified: Boolean(isAccount_verified),
                is_policies_accepted: true
            },
            pushnotif_token: null,
            last_updated: last_updated,
            date_registered: {
                date: date_updated
            }

        })

}


clientMongo.connect(function(err) {
                            
    if (err) {
        console.log(err)
    } else {
        const dbMongo = clientMongo.db(dbName)
        const collectionPassengers = dbMongo.collection("passengers_profiles")

        // Initialize inserted passengers counter
        let InsertedCount = 0

        console.log("Connected to MongoDB")
        let ID_success = []
        let ID_fail = []

        con.connect(function(err) {
            console.log("Connected to MYSQL")
            if (err) {
                console.log(error)
            } else {
                console.log("No Connection error detected...")
        
                con.query("SELECT * FROM central_passengers_profiles", function (err, result, fields) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(`Total number passengers found: ${result.length}`)
                        console.log("**************************************")
                        //console.log(result[0]["banking_details"].split("|"))
                        /*console.log(result[0]["taxi_number"]); */ 
                        //console.log(result)
        
                        result.forEach( passenger => {
                            new Promise((res) => {
                                // Create the query object
                                createPassengerQueryObject(passenger["name"], passenger["surname"],passenger["gender"],
                                    passenger["fingerprint"], passenger["phone_number"], passenger["email"],
                                    passenger["profile_pic"], passenger["isAccount_verified"], passenger["last_updated"],
                                    passenger["date_updated"], res)
                            })
                            .then((passengerQuery) => {
                                
                                // Inserting passenger in MongoDB
                                console.log(`******   The ID: ${passenger["ID"]}****************************`)

                                console.log(passengerQuery)
                                

                                collectionPassengers
                                .updateOne(passengerQuery, {$set: passengerQuery}, {upsert: true})
                                .then((result2) => {
                                    console.log(result2.result)
                                    // Increase counter by 1 if document inserted
                                    InsertedCount = result2.result.upserted? InsertedCount+1 : InsertedCount
                                    
                                    console.log(`Number of passengers inserted: ${InsertedCount}`)
                                    console.log(`Success rate: ${(InsertedCount/(result.length))*100}%`)

                                    // Delete record if saved in MongoDB
                                    if(result2.result.upserted) {
                                        ID_success.push(passenger["ID"])
                                        // Delete from MySQL
                                        let sql = `DELETE FROM central_passengers_profiles WHERE ID=${passenger["ID"]}`
                                        con.query(sql, function (err, result) {
                                            if (err) throw err;
                                            console.log("Number of records deleted: " + result.affectedRows);
                                          })
                                    } else {
                                        ID_fail.push(passenger["ID"])
                                        console.log("Missed IDs: ")
                                        console.log(ID_fail)
                                    }

                                    



                                })
                                .catch((error) => {
                                    console.log(error)
                                }) 
                                console.log("=========================================")
                                //console.log(passengerQuery) */
                                
 
                            })
                            .catch((error) => {
                                console.log(error)
                            })
                        
                        })

                    }
                    
                    
                }) 
                
            }
           
        })

    }

})





