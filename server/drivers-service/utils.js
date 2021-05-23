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
 * @function updateEntry: Updates a document's entries of a given collection
 * @param {collection} collection: The collection to be affected
 * @param {object} query : Used to identify the document to be updated
 * @param {object} newValues: New values to be updated
 * @param {*} resolve 
 */
 function updateEntry(collection, query, newValues, resolve) {
    
    collection
    .updateOne(query, {$set: newValues})
    .then((result) => {
        console.log(result.result)
        if(result.result.nModified != 0) {

          console.log(" ONE DOCUMENT UPDATED")
          resolve({success: "one document updated"})

        } else {
          
          console.log(result)
          resolve({error: "The document was not updated"})
          
        }
        
    })
    .catch(error => {
        console.log(error)
        resolve({error: "The document was not updated"})
    })
}



function MakePaymentCommissionTCSubtracted(
  walletTransactionsLogsCollection, 
  recipient_fp, 
  amount, 
  resolve) {

    if(amount === null || recipient_fp === null || amount=== undefined || recipient_fp === undefined) {
      resolve({error: "Seems like wrong parameters @db query"})
    }
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
        } else {
          resolve({error: "Seems like wrong parameters @db query"})
        }
    })
    .catch((error) => {
        console.log(error)
        resolve({error: "Seems like wrong parameters @db query"})
    })

}

// Exported functions
exports.updateEntry = updateEntry
exports.MakePaymentCommissionTCSubtracted = MakePaymentCommissionTCSubtracted