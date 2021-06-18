import React, { useState, useEffect } from 'react'
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import socket from '../socket'
import "./Visualize.css"
import Sidebar from "../sidebar/sidebar"

export default function MonthlyDataDetailed() {

    let [monthlyData, setmonthlyData] = useState([])
    let [defaultyear, setDefaultYear] = useState(true)
    let [year, setYear] = useState("")
    let [monthNumber, setMonthNumber] = useState("")
    

    useEffect(() => {

        console.log("Visualizing daily data per month")

    }, [
        // Empty
    ])

    const getMonthlyDataHandler = (e) => {
        e.preventDefault()

        if(year.length > 0 && monthNumber.length > 0) {
            socket.on("get-monthly-per-day-rides-data-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setmonthlyData(data)
                }
            })
            socket.emit("get-monthly-per-day-rides-data", { year: year, monthNumber: monthNumber})

        } else {
            alert("Year and Month not Specified")
        }
        

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
                MONTHLY DATA
            </h1>
            <br></br>
            <form onSubmit = {getMonthlyDataHandler} >
            <div className="form-group ml-4">
                <label> Year </label>
                <select
                    required
                    className="form-control "
                    style={{ width: 350 }}
                    value={year}
                    onChange={(e) => { setYear(e.target.value) }}>
                        <option></option>
                <option key="2021" value="2021">2021</option>
                <option key="2020" value="2020">2020</option>
                </select>
            </div>
            <div className="form-group ml-4">
                <label> Month </label>
                <select
                    required
                    className="form-control "
                    style={{ width: 350 }}
                    value={monthNumber}
                    onChange={(e) => { setMonthNumber(e.target.value) }}>
                        <option></option>
                <option key="1" value="1">January</option>
                <option key="2" value="2">February</option>
                <option key="3" value="3">March</option>
                <option key="4" value="4">April</option>
                </select>
            </div>
            <div className="submit-registration">
                <input
                style = {{ backgroundColor: 'green'}}
                type="submit"
                value="Register"
                className="btn btn-primary btn-block mt-4"
                />
            </div>
            </form>

            <button onClick={() => getMonthlyDataHandler() } className="btn btn-primary">Click </button>
            
            
            
            <div style={styles.graph} className="plots">
                <div className="plot">
                    <h3 className="plot-title"> Monthly Data</h3>
                    <BarChart width={500} height={400} data={MonthlyDataDetailed} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar name="successful_rides_count" dataKey="successful_rides_count" fill="#10659e" />
                        <Bar name="successful_rides_count" dataKey="successful_rides_count" fill="#9e0b50" />    
                    </BarChart>
                   
                    
                </div>
            </div>
        </div>
        
    </div>
  )
}
