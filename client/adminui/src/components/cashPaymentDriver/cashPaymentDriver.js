import React, { Fragment, useState } from 'react'
import axios from 'axios'
import Sidebar from '../sidebar/sidebar'
require('dotenv').config({ path: "../../../.env"})

export default function CashPaymentDriver() {

    let [taxi_number, setTaxiNumber] = useState("")
    let [paymentNumber, setPaymentNumber] = useState("")
    let [amount, setAmount] = useState("")
    let [payment_with, setPaymentWith] = useState("")

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        const formData = new FormData()

        formData.append("taxi_number", taxi_number)
        formData.append("paymentNumber", paymentNumber)
        formData.append("amount", amount)

        console.log("Submitting...")
        
        try {

            const res = await axios.post(`http://localhost:10011/cash-payment`, formData , {
                headers: {
                    'Content-Type': 'multipart/form-data'
                } 
            })

            console.log(res.data)
            alert("Successfully submitted")

            setTaxiNumber("")
            setPaymentNumber("")
            setAmount("")
            setPaymentWith("")

        } catch(err) {
            console.log(err)
            if (err.response.status === 500) {
                alert("No driver match, enter correct taxi number or payment number")
            } else {
                alert("Error: The payment was not made. Maybe server error or wrong parameters")
            }
            
        } 
        /*axios.post(`${process.env.ROOT_URL}:${process.env.DRIVER_ROOT}/cash-payment`, formData)
        .then((result) => { console.log(result)}) */
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
