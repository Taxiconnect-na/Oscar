import React, { useState, useEffect } from "react"
import Sidebar from "../sidebar/sidebar"
import io from "socket.io-client"
import "./PassengerList.css"
import { FaUserAlt } from "react-icons/fa"
require("dotenv").config({ path : "../../../.env"})

const PassengerRow = (props) => {
    return(
        <tr>
            <td><FaUserAlt size={30}/></td>
            <td>{ props.passenger.name}</td>
            <td>{ props.passenger.surname }</td>
            <td>{ props.passenger.gender }</td>
            <td>{ props.passenger.phone_number }</td>
            <td>{ props.passenger.email }</td>
            <td>{ props.passenger.date_registered.date }</td>
            <td>{ props.passenger.totaltrip }</td>
        </tr>
    )
}


function PassengerList() {

    let [passengers, setPassengers] = useState([])
    let [totalNewPassengerToday, setTotalNewPassengerToday] = useState(0)

    let ENDPOINT = process.env.GATEWAY

    useEffect(() => { 
        let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    reconnectionAttempts: Infinity})
        const interval = setInterval(() => {
            console.log("passengerslist@taxiconnect")
            socket.on("getPassengers-feedback", (data) => {
                if ((data !== undefined) && (data != null)) {
                    console.log(data)
                    //mydata = data
                    setPassengers(data)
 
                }
            });
          
            socket.emit("getPassengers", {data:'getting passengers'})
            
            // Get the statistics 
            /*socket.on("statistics-response", (data) => {

                setTotalNewPassengerToday(data["totalNewPassengerToday"])
            });
            socket.emit("statistics", {data:'specs'}) */


        }, 2000)

        return( () => {
            clearInterval(interval)
        })
    },[ // Re-render whenever any of the following variables changes
        
        ENDPOINT
    ])

    const passengerData = () => {
        return passengers.map((passenger) => {
            return <PassengerRow passenger={passenger} />
        })
        
    }
    const title_style = {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 15
    }

    //console.log(passengers) 
    return(
        <div>
            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h2 style={ title_style }>Registered Users</h2>
                    <hr></hr>
                            <div id="container-driver">
                                
                                <div>
                                <h1 style={{ fontSize: 'large', color:"black", width: "auto"}}> Total sign up:  
                                    <span style={{ fontSize: 'large', color:"blue"}}> { passengers.length } </span>  
                                </h1>
                                </div>
                                <div>
                                <h1 style={{ fontSize: 'large', color:"black", width: "auto"}}> New sign up (today):  
                                    <span style={{ fontSize: 'large', color:"blue"}}> { totalNewPassengerToday } </span>  
                                </h1>
                                </div>
                          
                            </div>
                    <hr></hr>

                    <table className="table-striped" style={{ margin: 15}}>
                        <thead className="thead-light">
                            <tr>
                                <th>Profile</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Genger </th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Signed up</th>
                                <th>Total trips</th>
                            </tr>

                        </thead>
                        <tbody>
                          { passengerData() }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PassengerList