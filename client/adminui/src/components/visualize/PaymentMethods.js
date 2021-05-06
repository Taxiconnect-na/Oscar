import React, { useState, useEffect } from 'react'
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import socket from '../socket'
import "./Visualize.css"
import Sidebar from "../sidebar/sidebar"

export default function PaymentMethods() {

    let [monthlyPaymentMethods, setMonthlyPaymentMethods] = useState([])
    let [defaultyear, setDefaultYear] = useState(true)
    let [year, setYear] = useState("2021")
    

    useEffect(() => {

    
        // Ride counts
        socket.on("get-rides-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyPaymentMethods(data)
            }
        })
        socket.emit("get-rides-count-vis", { year: year})

    }, [
        // Empty
    ])

    const changeYearHandler2020 = () => {

        if(defaultyear) {
            setYear("2020")
            setDefaultYear(false)
        }

        // Ride counts
        socket.on("get-rides-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyPaymentMethods(data)
            }
        })
        socket.emit("get-rides-count-vis", { year: year})

    }


    /**
     * * Custom Styles (In line)
     */
     const styles = {
        graph: {
           
            margin: "3%",
            padding: "2%"
        }
    }

  return (
    
    <div className="template">
        
        <div className="sidebar">
            <Sidebar />
        </div>

        <div className="main-content" id="ride-counts">
            <h1 className="plot-main-title" style={{ display: "grid", placeItems:"center", padding: "2%", backgroundColor: "whitesmoke" }}>
                PAYMENT METHODS 
            </h1>
            <br></br>
            

            <div style={styles.graph} className="plots">
                <div className="plot">
                    <h3 className="plot-title"> Monthly Payment Method Counts</h3>
                    <BarChart width={500} height={400} data={monthlyPaymentMethods} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Cash" dataKey="CASH" fill="#a14102" />
                        <Bar name="Wallet" dataKey="WALLET" fill="#d10628" />    
                    </BarChart>
                    <button onClick={ () => { changeYearHandler2020() }} className="btn btn-info">View 2020</button>
                    
                </div>
            </div>
        </div>
        
    </div>
  )
}
