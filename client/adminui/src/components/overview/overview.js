import React, { useState, useEffect } from 'react'
//import axios from "axios"
import io from 'socket.io-client'
import Sidebar from '../sidebar/sidebar'
import './overview.css' 


function Overview() {
    // Initialize statistics state
    let [totalFareSuccessful, setTotalFareSuccessful] = useState(550)
    let [totalTripSuccessful, setTotalTripSuccessful] = useState(146)
    let [totalFareCancelled , setTotalFareCancelled ] = useState(67)
    let [totalTripCancelled, setTotalTripCancelled] = useState(45)
    let [totalFareSuccessfulToday, setTotalFareSuccessfulToday] = useState(30)
    let [totalTripSuccessfulToday, setTotalTripSuccessfulToday ] = useState(3)
    let [totalFareCancelledToday, setTotalFareCancelledToday] = useState(58)
    let [totalTripCancelledToday , setTotalTripCancelledToday ] = useState(7)
    let [totalNewDriverToday, setTotalNewDriverToday ] = useState(6)
    let [totalNewPassengerToday, setTotalNewPassengerToday] = useState(50)
    let [totalCash, setTotalCash] = useState(762)
    let [totalWallet, setTotalWallet] = useState(345)
    let ENDPOINT = 'localhost:5558'
    
    
    useEffect(() => { 
        let socket = io(ENDPOINT, {transports: ['websocket', 'polling', 'flashsocket']})
        const interval = setInterval(() => {
            console.log("mack@taxiconnect")
            socket.on("statistics-response", (data) => {
                console.log(data)
                //mydata = data
                setTotalFareSuccessful(data["totalFareSuccessful"])
                setTotalTripSuccessful(data["totalTripSuccessful"])
                setTotalFareCancelled(data["totalFareCancelled"])
                setTotalTripCancelled(data["totalTripCancelled"])
                setTotalFareSuccessfulToday(data["totalFareSuccessfulToday"])
                setTotalTripSuccessfulToday(data["totalTripSuccessfulToday"])
                setTotalFareCancelledToday(data["totalFareCancelledToday"])
                setTotalTripCancelledToday(data["totalTripCancelledToday"])
                setTotalNewDriverToday(data["totalNewDriverToday"])
                setTotalNewPassengerToday(data["totalNewPassengerToday"])
                setTotalCash(data["totalCash"])
                setTotalWallet(data["totalWallet"])
                console.log(data["totalCash"])

            });
            //...
            socket.emit("statistics", {data:'specs'});
        }, 2000)

        return( () => {
            clearInterval(interval)
        })
    },[ // Re-render whenever any of the following variables changes
        totalFareSuccessful,
        totalTripSuccessful,
        totalFareCancelled,
        totalTripCancelled,
        totalFareSuccessfulToday,
        totalTripSuccessfulToday,
        totalFareCancelledToday,
        totalTripCancelledToday,
        totalNewDriverToday,
        totalNewPassengerToday,
        totalCash,
        totalWallet, 
        ENDPOINT
    ])

    return(
        <div> 
            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={{ marginLeft: 100, marginTop: 15 , backgroundColor: "#b6313c", color:"black"}}>Summary</h1>
                    <div id="title" style={{ marginLeft: 400 }}><h2 >Today </h2></div>
                    <div className="content">
                        <div >
                        <h1 style={{ fontSize: 'xx-large', color:"green"}}>{ totalTripSuccessfulToday } 
                        <span style={{ fontSize: 'small', color:"black"}}>     successful trip</span> 
                        </h1>
                        <h1 style={{ fontSize: 'xx-large', color:"red"}}>{ totalTripCancelledToday} 
                        <span style={{ fontSize: 'small', color:"black"}}>     cancelled trip</span> 
                        </h1>
                        </div> 

                        <div >
                        <h1 style={{ fontSize: 'xx-large', color:"green"}}>N$ { totalFareSuccessfulToday } 
                        <span style={{ fontSize: 'small', color:"black"}}>    processed </span> 
                        </h1>
                        <h1 style={{ fontSize: 'xx-large', color:"red"}}>N$ { totalFareCancelledToday } 
                        <span style={{ fontSize: 'small', color:"black"}}>    lost </span> 
                        </h1>
                        </div>                          
                    </div>
                    
                    <div id="table">
                        <table className="table">
                            <thead className="thead-light">
                                <tr>
                                    <th colSpan="2">New Sign Up</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Users</td>
                                    <td>Drivers</td>
                                </tr>
                                <tr>
                                    <td>{ totalNewPassengerToday }</td>
                                    <td>{ totalNewDriverToday }</td>
                                </tr>
                            </tbody>
                        </table>
                    </div><br></br>
                    <hr></hr>

                    <div id="title" style={{ marginLeft: 400 }}><h2 >Overall </h2></div>
                    <div className="content">
                        <div style={{ backgroundColor: "#8d9294"}}>
                        <h1 style={{ fontSize: 'xx-large', color:"green"}}>{ totalTripSuccessful } 
                        <span style={{ fontSize: 'small', color:"black"}}>     successful trip</span> 
                        </h1>
                        <h1 style={{ fontSize: 'xx-large', color:"red"}}>{ totalTripCancelled } 
                        <span style={{ fontSize: 'small', color:"black"}}>     cancelled trip</span> 
                        </h1>
                        </div> 

                        <div style={{ backgroundColor: "#8d9294"}}>
                        <h1 style={{ fontSize: 'xx-large', color:"green"}}>N$ { totalFareSuccessful } 
                        <span style={{ fontSize: 'small', color:"black"}}>    processed </span> 
                        </h1>
                        <h1 style={{ fontSize: 'xx-large', color:"red"}}>N$ { totalFareCancelled } 
                        <span style={{ fontSize: 'small', color:"black"}}>    lost </span> 
                        </h1>
                        </div>                          
                    </div>

                    <div id="table">
                        <table className="table" id="table2">
                            <thead className="thead-light">
                                <tr>
                                    <th colSpan="2">Processed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>cash</td>
                                    <td>N$ { totalCash }</td>
                                </tr>
                                <tr>
                                    <td>wallet</td>
                                    <td>N$ { totalWallet }</td>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>N$ { totalCash + totalWallet }</td>
                                </tr>
                            </tbody>
                        </table>
                    </div><br></br>
                </div>  
            </div>
        </div>
    )

}


export default Overview
