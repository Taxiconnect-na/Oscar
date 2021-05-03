import React, { useState, useEffect } from 'react'
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';
import socket from '../socket'

export default function Visualize() {

    let [successfulRides, setSuccessfulRides] = useState([])
    let [year, setYear] = useState("2021")

    useEffect(() => {

        const interval = setInterval(() => {
            console.log("counting @visualizations.... ")
            
            socket.on("get-rides-count-vis-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setSuccessfulRides(data)
                }
            })
            socket.emit("get-rides-count-vis", { year: year})

        }, 20000)
        
        return( () => {
            clearInterval(interval)
        })

    }, [
        successfulRides
    ])

    const styles = {
        graph: {
            width: "100%",
            margin: "3%"
        }
    }

  return (
    <div>
        <h5> Hello here at visualization</h5>
        <div style={styles.graph}>
        <BarChart width={480} height={300} data={successfulRides}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar name="Successful" dataKey="successful" fill="#0e8714" />
            <Bar name="Cancelled" dataKey="cancelled" fill="#c20615" />    
        </BarChart>
        </div>
    </div>
  )
}
