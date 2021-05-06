import React, { useState, useEffect } from 'react'
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import socket from '../socket'
import "./Visualize.css"
import Sidebar from "../sidebar/sidebar"

export default function RideCounts() {

    let [monthlyRideCounts, setMonthlyRideCounts] = useState([])
    let [year, setYear] = useState("2021")

    useEffect(() => {

    
        // Ride counts
        socket.on("get-rides-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyRideCounts(data)
            }
        })
        socket.emit("get-rides-count-vis", { year: year})

    }, [
        // Empty
    ])

    const changeYearHandler = () => {
        setYear("2020")

        // Ride counts
        socket.on("get-rides-count-vis-feedback", (data) => {
            if((data !== undefined) && (data != null)) {
                //Update cancelledRides
                console.log(data)
                setMonthlyRideCounts(data)
            }
        })
        socket.emit("get-rides-count-vis", { year: year})

    }

    /**
     * * Custom Styles (In line)
     */
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
            <h1 style={{ display: "grid", placeItems:"center", padding: "2%"}}> RIDE COUNTS </h1>
            <br></br>
            

            <div style={styles.graph} className="plots">
                <div className="plot">
                    <h3 className="plot-title"> Monthly Ride Counts</h3>
                    <BarChart width={440} height={310} data={monthlyRideCounts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="Successful" dataKey="successful" fill="#3b0ba3" />
                        <Bar name="Cancelled" dataKey="cancelled" fill="#c20615" />    
                    </BarChart>
                    <button onClick={ () => { changeYearHandler() }} className="btn btn-info">2020</button>
                </div>
            </div>
        </div>
    </div>
  )
}
