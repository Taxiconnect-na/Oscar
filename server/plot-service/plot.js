// Mongodb Connection 
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb://localhost:27017"
//const uri = "mongodb+srv://taxiconnect-test-mongo-user:epzcVtEZ39ZvawlM@cluster0.cumod.mongodb.net/test?authSource=admin&replicaSet=atlas-13sofg-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true"
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });
const dbName = "Taxiconnect"

//* Check whether object is date or not
var is_date = function(input) {
    if ( Object.prototype.toString.call(input) === "[object Date]" ) 
      return true;
    return false;   
};


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

function GeneralPlottingData(collectionRidesDeliveryData, collectionRidesDeliveryDataCancelled ,filteringQuery, fire ) {

    collectionRidesDeliveryData
    .find(filteringQuery)
    //.limit(15000)
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
                    origin_location_suburb: data.pickup_location_infos.suburb,
                    ride_state: "successful"
                })
            })
            .catch((error) => {
                console.log(error)
                fire({error: "Failed to get general plotting data"})
            })
        })
        //Collect all promises and return final array of objects
        Promise.all(allObjects)
        .then((result1) => {
            console.log(`General plotting data count: ${result1.length}`)
            //console.log(result1)
            //fire(result)
            collectionRidesDeliveryDataCancelled
            .find({})
            .limit(10000)
            //.sort({date_requested: -1 })
            .toArray()
            .then((rides0) => {
                // Object containing promise of all final data
                allObjectsCancelled = rides0.map((data) => {
                    return new Promise((resolve) => {
                        // Store following object to allObjectsCancelled Array
                        // Make sure the date returned is an object of type date
                        if(is_date(data.date_requested)){ 
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
                                origin_location_suburb: data.pickup_location_infos.suburb,
                                ride_state: "cancelled"
                            })
                        } else {
                            // For Test data that was not in wanted format before live data
                            resolve({
                                year: "2021",
                                month: "1",
                                dayNumber:"3",
                                dayName: "Mon",
                                timeHour: "10",
                                monthDay: "2-13",
                                yearMonth: "2021-1",
                                yearMonthDay: "2021-1-3",
                                fare: Number(data.fare),
                                payment_method: data.payment_method,
                                connect_type: data.connect_type,
                                origin_location_suburb: data.pickup_location_infos.suburb,
                                ride_state: "cancelled"
                            })
                        }
                        
                    })
                    .catch((error) => {
                        console.log(error)
                        fire({error: "Failed to get general plotting data"})
                    })
                })
                //Collect all promises and return final array of objects
                Promise.all(allObjectsCancelled)
                .then((result2) => {
                    console.log(`General plotting data count cancelled: ${result2.length}`)
                   // console.log(result2)
                    //fire(result2)
                    //Return the combination of both lists (cancelled and successful) as ONE LIST
                    fire(result1.concat(result2))
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
function MonthlyDataCount(dataToGroup, filteringYear, resolve) {
    
    let sorted = dataToGroup.groupBy("yearMonth")
    //console.log(sorted)
    let sortedList = sorted.map((category) => {
        //return a promise for each object to be added to the list
        return new Promise((output) => {
            // Group internal groupList by ride_state
            let success_cancelled_group = category.groupList.groupBy("ride_state")
            let internalData = {}
            let internalList = success_cancelled_group.map((internalCategory) => {
                //console.log(internalCategory)
                return internalCategory
            })
            //console.log(internalList.find((each) => each.field === "cancelled"))
            //console.log(internalList.find((each) => each.field === "successful"))
            
            let cancelledObjectInternal = internalList.find((each) => each.field === "cancelled")
            let successfulObjectInternal = internalList.find((each) => each.field === "successful")

            if(cancelledObjectInternal) {

                console.log(`cancelled: ${cancelledObjectInternal.groupList.length}`)
                internalData.cancelled = cancelledObjectInternal.groupList.length
            
            } else if(!cancelledObjectInternal){

                console.log("no cancelled object here")
                internalData.cancelled = 0
            }

            if(successfulObjectInternal){
                console.log(`successful: ${successfulObjectInternal.groupList.length}`)
                internalData.successful = successfulObjectInternal.groupList.length
            } else if(!successfulObjectInternal) {
                console.log("No successful object here")
                internalData.successful = 0
            }
            
            output({
                date: category.field,
                successful: internalData.successful,
                cancelled: internalData.cancelled
            })
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


function MonthlyDataCountConnectType(dataToGroup, filteringYear, resolve) {
    
    let sorted = dataToGroup.groupBy("yearMonth")
    //console.log(sorted)
    let sortedList = sorted.map((category) => {
        //return a promise for each object to be added to the list
        return new Promise((output) => {
            // Group internal groupList by ride_state
            let connect_type_groups = category.groupList.groupBy("connect_type")
            let internalData = {}
            let internalList = connect_type_groups.map((internalCategory) => {
                //console.log(internalCategory)
                return internalCategory
            })
            //console.log(internalList.find((each) => each.field === "cancelled"))
            //console.log(internalList.find((each) => each.field === "successful"))
            
            let connectMeObjectInternal = internalList.find((each) => each.field === "ConnectMe")
            let connectUsObjectInternal = internalList.find((each) => each.field === "ConnectUs")

            if(connectMeObjectInternal) {

                console.log(`connectMe: ${connectMeObjectInternal.groupList.length}`)
                internalData.ConnectMe = connectMeObjectInternal.groupList.length
            
            } else if(!connectMeObjectInternal){

                console.log("no connectMe object here")
                internalData.ConnectMe = 0
            }

            if(connectUsObjectInternal){
                console.log(`connectUs: ${connectUsObjectInternal.groupList.length}`)
                internalData.ConnectUs = connectUsObjectInternal.groupList.length
            } else if(!connectUsObjectInternal) {
                console.log("No successful object @ connect Us")
                internalData.ConnectUs = 0
            }
            
            output({
                date: category.field,
                ConnectMe: internalData.ConnectMe,
                ConnectUs: internalData.ConnectUs
            })
        })
        .catch((error) => {
            console.log(error)
            resolve({error: "Failed to return the monthly list of data for connect Type"})
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
        resolve({error: "Failed to return the monthly list of data for connect Type"})
    })
    
}


function SumFareField(object) {
    const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0) // The sum function
    //Initialize array
    let finalArray = object.map((each) => {
        return each.fare
    })

    return Sum(finalArray)

}



function MonthlyDataFare(dataToGroup, filteringYear, resolve) {
    
    let sorted = dataToGroup.groupBy("yearMonth")
    //console.log(sorted)
    let sortedList = sorted.map((category) => {
        //return a promise for each object to be added to the list
        return new Promise((output) => {
            // Group internal groupList by ride_state
            let success_cancelled_group = category.groupList.groupBy("ride_state")
            // Initialise internal data Object 
            let internalData = {}
            let internalList = success_cancelled_group.map((internalCategory) => {
                //console.log(internalCategory)
                return internalCategory
            })
            
            let cancelledObjectInternal = internalList.find((each) => each.field === "cancelled")
            let successfulObjectInternal = internalList.find((each) => each.field === "successful")

            if(cancelledObjectInternal) {

                console.log(`cancelled: ${cancelledObjectInternal.groupList.length}`)
                internalData.cancelled = SumFareField(cancelledObjectInternal.groupList)
            
            } else if(!cancelledObjectInternal){

                console.log("no cancelled object here")
                internalData.cancelled = 0
            }

            if(successfulObjectInternal){
                console.log(`successful: ${successfulObjectInternal.groupList.length}`)
                internalData.successful = SumFareField(successfulObjectInternal.groupList)
            } else if(!successfulObjectInternal) {
                console.log("No successful object here")
                internalData.successful = 0
            }
            
            output({
                date: category.field,
                successful: internalData.successful,
                cancelled: internalData.cancelled
            })
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


function MonthlyDataCountPaymentMethod(dataToGroup, filteringYear, resolve) {
    
    let sorted = dataToGroup.groupBy("yearMonth")
    //console.log(sorted)
    let sortedList = sorted.map((category) => {
        //return a promise for each object to be added to the list
        return new Promise((output) => {
            // Group internal groupList by ride_state
            let payment_method_groups = category.groupList.groupBy("payment_method")
            let internalData = {}
            let internalList = payment_method_groups.map((internalCategory) => {
                //console.log(internalCategory)
                return internalCategory
            })
            //console.log(internalList.find((each) => each.field === "cancelled"))
            //console.log(internalList.find((each) => each.field === "successful"))
            
            let CASHObjectInternal = internalList.find((each) => each.field === "CASH")
            let WALLETObjectInternal = internalList.find((each) => each.field === "WALLET")

            if(CASHObjectInternal) {

                console.log(`connectMe: ${CASHObjectInternal.groupList.length}`)
                internalData.CASH = CASHObjectInternal.groupList.length
            
            } else if(!CASHObjectInternal){

                console.log("No successful object @ CASH")
                internalData.CASH = 0
            }

            if(WALLETObjectInternal){

                console.log(`Wallet: ${WALLETObjectInternal.groupList.length}`)
                internalData.WALLET= WALLETObjectInternal.groupList.length

            } else if(!WALLETObjectInternal) {

                console.log("No successful object @ WALLET")
                internalData.WALLET = 0
            }
            
            output({
                date: category.field,
                CASH: internalData.CASH,
                WALLET: internalData.WALLET
            })
        })
        .catch((error) => {
            console.log(error)
            resolve({error: "Failed to return the monthly list of data for payment method"})
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
        resolve({error: "Failed to return the monthly list of data for PAYMENT METHOD"})
    })
    
}

/**
 * 
 * @param {list} data : Data generated from GeneralPlottingData
 * @param {string} year 
 * @param {string} monthNumber 
 * @returns 
 */
function getRidesMonthDetailedData(data, year, monthNumber ) {
    return new Promise((resolve, reject) => {
        let filtered_data = data.filter((data) => {
            return data.yearMonth === `${year}-${monthNumber}`
        })
        
        console.log(filtered_data.length)

        let filtered_data_grouped = filtered_data.groupBy("dayNumber")

        let new_filtered_data = filtered_data_grouped.map((day) => {
            return new Promise((res) => {
                res({
                    year: year,
                    month: monthNumber,
                    day: day.field,
                    successful_rides_count: (day.groupList.filter((data) => { return data.ride_state==="successful"})).length,
                    cancelled_rides_count: (day.groupList.filter((data) => { return data.ride_state==="cancelled"})).length,
                    total_sales_successful: SumFareField(day.groupList.filter((data) => { return data.ride_state==="successful"})),
                    total_sales_cancelled: SumFareField(day.groupList.filter((data) => { return data.ride_state==="cancelled"}))
                })
            })
        })

        Promise.all(new_filtered_data)
        .then((outcome) => {
            resolve(outcome)
        })
        .catch((error) => {
            console.log(error)
            reject({error: true})
        })
        //console.log(filtered_data_grouped[0].groupList.filter((data) => { return data.ride_state==="successful"}))
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
        GeneralPlottingData(collectionRidesDeliveryData, collectionRidesDeliveryDataCancelled, query, fire)
    })
    .then((result) => {
        if(result.error) {
            console.log(" An error occured @GeneralPlottingData")
        } else {
            
            console.log(result.length)
            console.log("========================================") 
            
            getRidesMonthDetailedData(result, "2021", "3")
            .then((data) => {
                console.log(data)
            })
            
        }
    })
})

 // What else