import React, { useState, useEffect } from 'react'
import queryString from 'query-string'
import Sidebar from '../sidebar/sidebar'


export default function DriverCommissionInsert({ location }) {

  let [driverFingerPrint, setDriverFingerprint] = useState("")
  let [taxi_number, setTaxiNumber] = useState("")
  let [name, setName] = useState("")
  let [surname, setSurname] = useState("")
  let [amount, setAmount] = useState(0)

  let [success, setSuccess] = useState(false)
  let [failure, setFailure] = useState(false)
  let [uploading, setUploading] = useState(false)

  useEffect(() => {

      const { driver_identifier, taxi, dname, dsurname } = queryString.parse(location.search)

      setDriverFingerprint(driver_identifier)
      setTaxiNumber(taxi)
      setName(dname)
      setSurname(dsurname)

  }, [location.search])


  //* FORM SUBMISSION HANDLER
  const onSubmitHandler = (event) => {
    event.preventDefault()
    setUploading(true)

    const options = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          amount: amount,
          driver_fingerprint: queryString.parse(location.search).driver_identifier,
      })
      
    }

    fetch(`${process.env.REACT_APP_GATEWAY}/driver-commission-payment`, options)
    .then(response => response.json())
    .then(res => {
        console.log(res)
        if(res.success) {
            
            setSuccess(true)
            setUploading(false) 

        } else if(res.error) {
            
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

    console.log(amount)
  }
  

  const state_style = {
    success: {
        color: "green",
        display: "grid",
        placeItems: "center"
    },
    failure: {
        color: "red",
        display: "grid",
        placeItems: "center"
    },
    uploading: {
        color: "blue",
        display: "grid",
        placeItems: "center"
    }
  }
// Initialize upload wording state variables
  let state // For Taxi picture

  
  if(uploading) {
      state = <h5 style= { state_style.uploading} className="uploading"> Payment in progress...</h5>
  }
  if(success) {
      state = <h5 style={ state_style.success } className="upload-success"> Success</h5>   
  } 
  if(failure) {

      state = <h5 style={ state_style.failure} className="upload-failure"> Failed </h5>
  }

  const formStyle = {
    display: "grid",
    placeItems: "center",
    marginTop: "4%"
  }

  const wordingStyle = {
    margin: "3%",
    padding: "1%"
  }

  return (

    <div className="template">
              
      <div className="sidebar">
          <Sidebar />
      </div>

      <div className="main-content" >
        <div>
          <h5 style={wordingStyle}> You are about to make a payment for <strong>{ name? name: "unknown" } { surname }</strong> with taxi number: <strong> { taxi_number? taxi_number: "unknown" }</strong></h5>
        </div>
        <div style = {formStyle}>
          <form onSubmit={onSubmitHandler} >        
            <div className="form-group ml-4">
                <label>Insert amount :  </label>
                <input type="number"
                    required
                    className="form-control"
                    value={ amount }
                    onChange={(e) => { setAmount(e.target.value) }}
                    style={{ width: 350 }}
                    />
            </div>
            { state? state : <div className="submit-registration ml-4"  >
                <input
                style = {{ backgroundColor: 'green', width: 350}}
                type="submit"
                value="make payment"
                className="btn btn-primary btn-sm mt-4"
                />
            </div>}
                  
          </form>
        </div>
        
      </div>
    </div>


  )
}
