import React, { Fragment, useState } from 'react'
import socket from '../socket'
import Sidebar from '../sidebar/sidebar'
require('dotenv').config({ path: "../../../.env"})

/**
 * @function paymentObject: Returns an object with payment info
 * @param {string} taxi_number 
 * @param {string} paymentNumber 
 * @param {float} amount 
 * @param {return} resolve 
 */
function paymentObject(taxi_number, paymentNumber, amount, resolve) {
    resolve({
        taxi_number,
        paymentNumber,
        amount
    })
}

export default function CashPaymentDriver() {

    let [taxi_number, setTaxiNumber] = useState("")
    let [paymentNumber, setPaymentNumber] = useState("")
    let [amount, setAmount] = useState("")
    let [payment_with, setPaymentWith] = useState("")

    const onSubmitHandler = async (e) => {
        // Prevent default form submission
        e.preventDefault()
        // Make payment via socket
        new Promise((res) => {
            paymentObject(taxi_number, paymentNumber, amount, res)
        })
        .then((outcome) => {
            // Socket-response
            socket.on("makeDriverPayment-response", (data) => {
                console.log(data)

                if (data.error) {

                    alert("Something went wrong, Server error or invalid values")

                } else if (data.success) {

                    alert("Payment successfully made")
                    // Empty fields
                    setTaxiNumber("")
                    setPaymentNumber("")
                    setAmount("")
                    setPaymentWith("")
                    
                }
            })
            // Make payment via socket
            socket.emit("makeDriverPayment", outcome)
        })
        .catch((error) => {
            console.error(error)
            alert("OOps! Something went wrong")
        })

       
    }

  return (
    <div>
      <div className="wrapper"> 
                <div className="left-column">
                    <Sidebar />
                </div>
                <div className="right-column">
                    <Fragment >
                    <div className="right-column">
                    
                        <h1 style={{ textAlign: "center", marginBottom: 5, backgroundColor: "#179eb3", padding: 5 }}>
                            Make Payment </h1>
                        <form onSubmit={onSubmitHandler}> 
                            <div id="wrapper">
                                <div className="literal-info" style={{width: 250, margin:"auto", marginTop:50}}>
                                    <div className="form-group mb-4" >
                                        <label>Make payment with (select): </label>
                                        <select
                                            required
                                            className="form-control "
                                            style={{ width: 350 }}
                                            value={payment_with}
                                            onChange={(e) => { setPaymentWith(e.target.value) }}>
                                                <option></option>
                                        <option key="taxi_number" value="taxi_number">Taxi number</option>
                                        <option key="paymentNumber" value="paymentNumber">Payment number</option>
                                        </select>
                                    </div>

                                    <div className="form-group ml-4" style= {{ display: payment_with==="taxi_number"? "block":"none" }}>
                                        <label>Taxi number: </label>
                                        <input type="text"
                                            
                                            className="form-control"
                                            value={ taxi_number }
                                            onChange={(e) => { setTaxiNumber(e.target.value) }}
                                            style={{ width: 350 }}
                                            />
                                    </div>

                                    <div className="form-group ml-4" style= {{ display: payment_with==="paymentNumber"? "block":"none" }}>
                                        <label>Payment number: </label>
                                        <input type="number"
                                            
                                            className="form-control"
                                            value={ paymentNumber }
                                            onChange={(e) => { setPaymentNumber(e.target.value) }}
                                            style={{ width: 350 }}
                                            />
                                    </div>
                                    
                                
                                    <div className="form-group ml-4">
                                        <label>Amount: </label>
                                        <input type="number"
                                            required
                                            className="form-control"
                                            value={ amount }
                                            onChange={(e) => { setAmount(e.target.value) }}
                                            style={{ width: 350 }}
                                            />
                                    </div>

                                    <div className="submit-registration ml-4" style={{ display: (taxi_number || paymentNumber)? "block":"none"}} >
                                        <input
                                        style = {{ backgroundColor: 'green', width: 350}}
                                        type="submit"
                                        value="make payment"
                                        className="btn btn-primary btn-sm mt-4"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    </Fragment>

                </div>
            </div>
  
    </div>
  )
}
