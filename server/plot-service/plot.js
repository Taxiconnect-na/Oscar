// Mongodb Connection 
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb://localhost:27017"
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });
const dbName = "Taxiconnect"


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
                    dayMonth: (data.date_requested.getMonth() + 1).toString() + "-"+ data.date_requested.getDate().toString(),
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

clientMongo.connect(function() {

    const dbMongo = clientMongo.db(dbName)

    const collectionPassengers_profiles = dbMongo.collection(
        "passengers_profiles"
    );
    const collectionDrivers_profiles = dbMongo.collection("drivers_profiles");
    const collectionRidesDeliveryData = dbMongo.collection(
        "rides_deliveries_requests"
    );
    const collectionRidesDeliveryDataCancelled = dbMongo.collection(
        "cancelled_rides_deliveries_requests"
    );
    const collectionOwners = dbMongo.collection("owners_profiles") 

    const collectionAdminUsers = dbMongo.collection("internal_admin_users")
    
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
        } else {
            console.log(result)
        }
    })
})