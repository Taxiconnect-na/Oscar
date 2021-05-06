import React, { useState, useEffect } from 'react'
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import socket from '../socket'
import "./Visualize.css"
import Sidebar from "../sidebar/sidebar"



export default function Visualize() {

    let [successfulRides, setSuccessfulRides] = useState([])
    let [monthlyGrossSales, setMonthlyGrossSales] = useState([])
    let [monthlyRevenues, setMonthlyRevenues] = useState([])
    let [monthlyConnectType , setMonthlyConnectType] = useState([])
    let [monthlyPaymentMethod, setMonthlyPaymentMethod] = useState([])
    let [year, setYear] = useState("2021")

    useEffect(() => {

        const interval = setInterval(() => {
            console.log("counting @visualizations.... ")
            // Ride counts
            socket.on("get-rides-count-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setSuccessfulRides(data)
                }
            })
            socket.emit("get-rides-count-vis", { year: year})

            // Gross sales
            socket.on("get-rides-grossSales-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setMonthlyGrossSales(data)
                }
            })
            socket.emit("get-rides-grossSales-vis", { year: year})

            // Monthly Revenues
            socket.on("get-rides-revenues-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setMonthlyRevenues(data)
                }
            })
            socket.emit("get-rides-revenues-vis", { year: year})

            // Monthly Connect types
            socket.on("get-monthly-connect-type-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setMonthlyConnectType(data)
                }
            })
            socket.emit("get-monthly-connect-type-vis", { year: year})

            // Monthly Payment Methods
            socket.on("get-monthly-payment-method-count-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setMonthlyPaymentMethod(data)
                }
            })
            socket.emit("get-monthly-payment-method-count-vis", { year: year})

        }, 600000)
        /*
        return( () => {
            clearInterval(interval)
        }) */

    }, [
        successfulRides,
        year
    ])

    const changeYearHandler = () => {

        setYear("2020")

        // Ride counts
        socket.on("get-rides-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setSuccessfulRides(data)
            }
        })
        socket.emit("get-rides-count-vis", { year: year})

        // Gross sales
        socket.on("get-rides-grossSales-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyGrossSales(data)
            }
        })
        socket.emit("get-rides-grossSales-vis", { year: year})

        // Monthly Revenues
        socket.on("get-rides-revenues-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyRevenues(data)
            }
        })
        socket.emit("get-rides-revenues-vis", { year: year})

        // Monthly Connect types
        socket.on("get-monthly-connect-type-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyConnectType(data)
            }
        })
        socket.emit("get-monthly-connect-type-vis", { year: year})

        // Monthly Payment Methods
        socket.on("get-monthly-payment-method-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyPaymentMethod(data)
            }
        })
        socket.emit("get-monthly-payment-method-count-vis", { year: year})

    }

    const styles = {
        graph: {
           
            margin: "3%"
        }
    }

  return (
    <div className="template">
        <div className="sidebar">
            <Sidebar />
        </div>

        <div className="main-content">
            <h1 style={{ display: "grid", placeItems:"center", padding: "2%"}}> DATA VISUALIZATION </h1>
            <br></br>
            <button onClick={ () => { changeYearHandler() }} className="btn btn-info">2020</button>

            <div style={styles.graph} className="plots">
                <div className="plot">
                    <h3 className="plot-title"> Monthly Ride Counts</h3>
                    <BarChart width={500} height={400} data={successfulRides} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Successful" dataKey="successful" fill="#3b0ba3" />
                        <Bar name="Cancelled" dataKey="cancelled" fill="#c20615" />    
                    </BarChart>
                </div>

                <div className="plot">
                    <h3 className="plot-title"> Monthly Gross Sales (N$)</h3>
                    <BarChart width={500} height={400} data={monthlyGrossSales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Processed" dataKey="successful" fill="#10659e" />
                        <Bar name="Lost" dataKey="cancelled" fill="#9e0b50" />    
                    </BarChart>
                </div>

                <div className="plot">
                    <h3 className="plot-title"> Monthly Revenues (N$)</h3>
                    <BarChart width={500} height={400} data={monthlyRevenues} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Processed" dataKey="successful" fill="#157a30" />
                        <Bar name="Lost" dataKey="cancelled" fill="#82051a" />    
                    </BarChart>
                </div>

                <div className="plot">
                    <h3 className="plot-title"> Connect Type Counts </h3>
                    <BarChart width={500} height={400} data={monthlyConnectType} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="ConnectMe" dataKey="ConnectMe" fill="#74006f" />
                        <Bar name="ConnectUs" dataKey="ConnectUs" fill="#103a6e" />    
                    </BarChart>
                </div>

                <div className="plot">
                    <h3 className="plot-title"> Monthly Payment Method Counts</h3>
                    <BarChart width={500} height={400} data={monthlyPaymentMethod} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Cash" dataKey="CASH" fill="#a14102" />
                        <Bar name="Wallet" dataKey="WALLET" fill="#d10628" />    
                    </BarChart>
                </div>
            </div>
        </div>
    </div>
  )
}
