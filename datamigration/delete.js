// Mongodb Connection 
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb://localhost:27017"
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });
const dbName = "Taxiconnect"

clientMongo.connect(function(err) {
                            
    if (err) {
        console.log(err)
    } else {
        const dbMongo = clientMongo.db(dbName)
        const collectionPassengers = dbMongo.collection("passengers_profiles")
        const collectionDrivers_profiles = dbMongo.collection("drivers_profiles")

        collectionPassengers
        //collectionDrivers_profiles
        .find({})
        .toArray()
        .then((result) => {
            console.log(result.length)

            result.forEach((document) => {

                console.log("Doc found")
                collectionPassengers
                //collectionDrivers_profiles
                .deleteOne(document)
                .then((outcome) => {
                    console.log("One object deleted ")
                })
                .catch((error) => {
                    console.log(error)
                })
            } )
        })
        .catch((error) => {
            console.log(error)
        })

    }
})