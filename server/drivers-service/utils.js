const winston = require('winston')
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
})
/**Options:
 * logger.info("")
 * logger.warn("")
 * logger.error("")
 */

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
        logger.error(error.message)
        resolve({error: "The document was not updated"})
    })
}
exports.updateEntry = updateEntry


function MakePaymentCommissionTCSubtracted(
  walletTransactionsLogsCollection, 
  recipient_fp, 
  amount, 
  resolve) {

    if(amount === null || recipient_fp === null || amount=== undefined || recipient_fp === undefined || amount===0) {
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
// Exported function
exports.MakePaymentCommissionTCSubtracted = MakePaymentCommissionTCSubtracted


exports.getReferrals = (collectionReferralsInformationGlobal, resolve) => {

  collectionReferralsInformationGlobal
  .find({})
  .toArray()
  .then((referrals) => {
    const active_referrals = referrals.filter((referral) => {
      return referral.is_referralExpired === false
    })

    const expired_referrals = referrals.filter((referral) => {
      return referral.is_referralExpired === true
    })

    const rejected_referrals = referrals.filter((referral) => {
      return referral.is_referral_rejected === true
    })

    logger.info("==============  ACTIVE REFERRALS =================")
    logger.info(active_referrals)
    logger.info("===================================================")

    logger.info("==============  EXPIRED REFERRALS =================")
    logger.info(expired_referrals)
    logger.info("===================================================")

    logger.info("==============  REJECTED REFERRALS =================")
    logger.info(rejected_referrals)
    logger.info("===================================================")


    resolve({
      success: true,
      data: {
        active_referrals,
        expired_referrals,
        rejected_referrals
      }
      
    })
  })
  .catch((error) => {
    logger.error(error.message)
    resolve({success: false, error: error.message})
  })
}

exports.updateIsReferralPaid = (collectionReferralsInformationGlobal, referral_fingerprint, resolve) => {

  collectionReferralsInformationGlobal
  .findOne({referral_fingerprint: referral_fingerprint})
  .then((result) => {

    if(!result) {
      resolve({success: false, error: "Could not update referral payment status"})

    } else if(result) {
      logger.info(result)
      logger.info(`============  is_paid status: ${result.is_paid}   ============`)
      //resolve({success: true, data: result })

      //Update is_paid status
      new Promise((res) => {
        updateEntry(collectionReferralsInformationGlobal,
           {referral_fingerprint: referral_fingerprint},
           {is_paid: !result.is_paid},
           res
        )
      })
      .then((outcome) => {
        if(outcome.success) {
          resolve({success: true, message: "Referral updated!"})
        } else {
          resolve({success: false, error: "Failed to update referral! "})
        }

      })
      .catch((error) => {
        logger.error(error.message)
        resolve({success: false, error: error.message })
      })
    }

  })
  .catch((error) => {
    logger.error(error.message)
    resolve({success: false, error: error.message })
  })
}


exports.updateIsReferralRejected = (collectionReferralsInformationGlobal, referral_fingerprint, resolve) => {

  collectionReferralsInformationGlobal
  .findOne({referral_fingerprint: referral_fingerprint})
  .then((result) => {

    if(!result) {
      resolve({success: false, error: "Could not update referral"})

    } else if(result) {
      logger.info(result)
      logger.info(`============  is_referral_rejected status: ${result.is_referral_rejected}   ============`)
      //resolve({success: true, data: result })

      //Update is_referral_rejected status
      new Promise((res) => {
        updateEntry(collectionReferralsInformationGlobal,
           {referral_fingerprint: referral_fingerprint},
           {is_referral_rejected: !result.is_referral_rejected},
           res
        )
      })
      .then((outcome) => {
        if(outcome.success) {
          resolve({success: true, message: "Referral updated!"})
        } else {
          resolve({success: false, error: "Failed to update referral! "})
        }

      })
      .catch((error) => {
        logger.error(error.message)
        resolve({success: false, error: error.message })
      })
    }

  })
  .catch((error) => {
    logger.error(error.message)
    resolve({success: false, error: error.message })
  })
}

exports.deleteEntry = (collection, query, resolve) => {
  collection
  .deleteOne(query)
  .then((result) => {
    /*console.log(result.result)
    console.log(result.message)
    console.log(result.deletedCount)*/
    //console.log(result)

    if(result.deletedCount === 1) {
      resolve({success: true, message: "Deleted one entry"})
    } else {
      resolve({success: false, error: "Failed to delete entry"})
    }
    
  })
  .catch((error) => {
    logger.error(error.message)
    resolve({success: false, error: error.message})
  })
}