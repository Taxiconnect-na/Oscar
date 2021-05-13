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


// Exported functions
exports.updateEntry = updateEntry