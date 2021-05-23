// Mongodb Connection 
const MongoClient = require("mongodb").MongoClient
const uri = "mongodb://localhost:27017"
const clientMongo = new MongoClient(uri, {
    useUnifiedTopology: true,
  });
const dbName = "Taxiconnect"

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


function MakePaymentCommissionTCSubtracted(
    walletTransactionsLogsCollection, 
    recipient_fp, 
    amount, 
    resolve) {
    // Initialize transaction object
    const transaction = {}

    const transaction_nature = "commissionTCSubtracted"
    const receiver = "TAXICONNECT"
    const date_captured = windhoekDateTime

    transaction.amount = amount
    transaction.transaction_nature = transaction_nature
    transaction.receiver = receiver
    transaction.recipient_fp = recipient_fp
    
    transaction.date_captured = date_captured
    

    // Insert transaction into db
    walletTransactionsLogsCollection
    .insertOne(transaction)
    .then((res) => {
        
        if(res.result.ok) {
            console.log(res.result)
            resolve({success: "One payment inserted"})
        }
    })
    .catch((error) => {
        console.log(error)
        resolve({error: "Seems like wrong parameters @db query"})
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

    const collectionWallet_transaction_logs = dbMongo.collection(
        "wallet_transactions_logs"
    )

    //! Variables
    const recipient_fp = "xx xx xe03653169b9c18193a0b8dd329ea1e43eb0626ef9f16b5b979694a429710561a3cb3ddae".replace(/\s/g, "")
    //const amount = Number(12.5)
    let pay = Number("12.5")

    new Promise((res) => {
      MakePaymentCommissionTCSubtracted(collectionWallet_transaction_logs,
        recipient_fp, pay, res)
    })
    .then((outcome) => {
        console.log(outcome)
        if(outcome.success){
          console.log("SUCCESSFUL INSERTION OF DRIVER PAYMENT (COMMISSION)")
          // Send back successful response object
        } else if(outcome.error){
          console.log("FAILED TO INSERT PAYMENT")
          // send back error response object
        }
    }) 
    .catch(error => console.log(error))
})

/*
{
    "_id": {
        "$oid": "60aa6ca847b0bb49938a9955"
    },
    "amount": 12.5,
    "transaction_nature": "commissionTCSubtracted",
    "receiver": "TAXICONNECT",
    "recipient_fp": "xxxxxe03653169b9c18193a0b8dd329ea1e43eb0626ef9f16b5b979694a429710561a3cb3ddae",
    "date_captured": {
        "$date": "2021-05-23T16:54:32.000Z"
    }
}

    {"_id":{"$oid":"60aa28c35fed9aacf74e9107"},
    "amount":497.86,"transaction_nature":"commissionTCSubtracted",
    "receiver":"TAXICONNECT",
    "recipient_fp":"8fcc61c5231899c3d6970c1926ace5dce3070ef975714199c9a8ef24d051383ac5a9b1e53c53d7e9",
    "date_captured":{"$date":"2021-05-21T09:22:50.000Z"}}

    */
