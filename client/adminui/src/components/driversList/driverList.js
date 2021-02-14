import React, { useState, useEffect } from "react"
import io from 'socket.io-client'
import Sidebar from '../sidebar/sidebar'
import "./driverList.css"
import { FaUserAlt } from "react-icons/fa"


function OnlineDrivers(driverArray, resolve) {
    let onlineDrivers = driverArray.filter(member => {
        return member.status === "online"
    })

    resolve(onlineDrivers)
}

const DriverRow = (props) => {
    return(
        <tr>
            <td><FaUserAlt size={30}/></td>
            <td>{ props.driver.name}</td>
            <td>{ props.driver.surname }</td>
            <td>{ props.driver.phone_number }</td>
            <td>{ props.driver.taxi_number }</td>
            <td>{ props.driver.plate_number }</td>
            <td>{ props.driver.car_brand }</td>
            <td>{ props.driver.status }</td>
            <td>{ props.driver.totalMoneyToday }</td> 
            <td>{ props.driver.todaytrip }</td>
        </tr>
    )
}

function DriverList() {
    
    let ENDPOINT = 'localhost:5558'
    let [drivers, setDrivers] = useState([])
    let [online_drivers_count, setOnlineDriversCount] = useState(0)

    useEffect(() => { 
        let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    reconnectionAttempts: Infinity})
        const interval = setInterval(() => {
            console.log("driverslist@taxiconnect")
            socket.on("getDrivers-response", (data) => {
                if ((data !== undefined) && (data != null)) {
                    console.log(data)
                    //mydata = data
                    setDrivers(data)   
                    new Promise((res) => {
                        OnlineDrivers(data, res)
                    }).then((result) => {
                        setOnlineDriversCount(result.length)
                        console.log(result)
                    }).catch((error) => {
                        console.log(error)
                    })

                }
            });
            //...
            socket.emit("getDrivers", {data:'getting drivers'});
        }, 2000)

        return( () => {
            clearInterval(interval)
        })
    },[ // Re-render whenever any of the following variables changes
        
        ENDPOINT
    ])

    const driverData = () => {
        return drivers.map((driver) => {
            return <DriverRow driver={driver} />
        })
        
    }
    const title_style = {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 15
    }

    return(
        <div> 
            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={ title_style }>Registered drivers</h1>
                    <hr></hr>
                            <div id="container-driver">
                                
                                <div>
                                <h1 style={{ fontSize: 'large', color:"black", width: "auto"}}> Currently registered:  
                                    <span style={{ fontSize: 'large', color:"blue"}}> { drivers.length } </span>  
                                </h1>
                                </div>
                                <div>
                                <h1 style={{ fontSize: 'large', color:"black", width: "auto"}}> Online:  
                                    <span style={{ fontSize: 'large', color:"blue"}}> { online_drivers_count } </span> 
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
                                <th>Phone </th>
                                <th>Taxi Number</th>
                                <th>Plate number</th>
                                <th>Car brand</th>
                                <th>Status</th>
                                <th>Daily profit</th>
                                <th>Daily connect</th>
                            </tr>

                        </thead>
                        <tbody>
                          { driverData() }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default DriverList