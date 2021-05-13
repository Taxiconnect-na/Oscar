import React, { useEffect, useState } from 'react'
import queryString from 'query-string'

const getBase64 = file => {
    return new Promise(resolve => {
      let fileInfo
      let baseURL = ""
      // Make new FileReader
      let reader = new FileReader()

      // Convert the file to base64 text
      reader.readAsDataURL(file)

      // on reader load somthing...
      reader.onload = () => {
        // Make a fileInfo Object
        console.log("Called", reader)
        baseURL = reader.result
        console.log(baseURL)
        resolve(baseURL)
      }
      console.log(fileInfo)
    })
}



export default function DriverDataUpdate({ location }) {

    let [driverFingerPrint, setDriverFingerprint] = useState("")
    let [taxi_number, setTaxiNumber] = useState("")
    // car file:
    let [taxi_picture, setTaxiPicture] = useState('')
    let [taxi_picture_name, setTaxiPictureName] = useState('Taxi picture')
    //Upload tracking variables
    let [success, setSuccess] = useState(false)
    let [failure, setFailure] = useState(false)
    let [uploading, setUploading] = useState(false)

    useEffect(() => {

        const { driverID, taxi } = queryString.parse(location.search)

        setDriverFingerprint(driverID)
        setTaxiNumber(taxi)

    }, [])

    console.log(driverFingerPrint)

    //Taxi picture handler
    const onSubmitTaxiPicture = (e) => {
        e.preventDefault()

        setUploading(true)
        console.log(taxi_picture_name)
        
        getBase64(taxi_picture)
        .then((result) => {

            try {
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        taxi_picture : result.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2],
                        taxi_picture_name: taxi_picture_name,
                        driverFingerPrint: queryString.parse(location.search).driverID,
                        taxi_number: queryString.parse(location.search).taxi
                    })
                    
                }

                fetch(`${process.env.REACT_APP_GATEWAY}/file`, options)
                .then(response => response.json())
                .then(res => {
                    console.log(res)
                    if(res.success) {
                        
                        setSuccess(true)
                        setUploading(false) 
    
                    } else if(res.failure) {
                        
                        setFailure(true)
                        setUploading(false)
                    }

                })
                .catch(error => {
                    console.error(error)
                    console.log(" Some errors occured @ client ")
                    setFailure(true)
                    setUploading(false)
                })
 
            } catch(err) {
                console.log(err)
                console.log('There was a problem with the server')
                setFailure(true)
                setUploading(false)
            }    
        })
    }

    const state_style = {
        success: {
            color: "green",
            display: "grid",
            placeItems: "center"
        }
    }
    let state

    if(uploading) {

        state = <h3> Uploading...</h3>

    }
    if(success) {
        state = <h3 style={ state_style.success }> Success</h3>
        
    } 
    if(failure) {

        state = <h3> Failed </h3>
    }

  return (
    <div>
        <h1> { driverFingerPrint } </h1>
        <h3> { taxi_number } </h3>
      <form onSubmit={onSubmitTaxiPicture} >
        <div className="custom-file mt-4">
                <input type="file" className="custom-file-input" id="customFile"
                    onChange={(e) => { 
                        setTaxiPicture(e.target.files[0])
                        setTaxiPictureName(e.target.files[0].name)
                    }} />
                <label className="custom-file-label" htmlFor="customFile">
                    {taxi_picture_name}
                </label> 
        </div>
        { state? state: <div className="submit-registration">
            <input
            style = {{ backgroundColor: 'blue'}}
            type="submit"
            value="Upload"
            className="btn btn-primary btn-block mt-4"
            />
        </div> }
      </form>

      
    </div>
  )
}
