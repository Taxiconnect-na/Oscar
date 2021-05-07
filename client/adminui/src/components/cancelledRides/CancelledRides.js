import React, {useState, useEffect} from "react"
import Sidebar from "../sidebar/sidebar"
//import io from 'socket.io-client'
import socket from '../socket'


const CancelledRideRow = (props) => {

    const dest = () => {
       
        return props.ride.destination.map((place) => {
            
            return <ul><li>{place}</li></ul>
        })
    }

    return(
        <>
            <tr>
                <td> { props.ride.passenger_name } </td>
                <td> {props.ride.origin} </td>
                <td> {dest()} </td>
                <td> { props.ride.date_requested.toString().slice(0,10) } </td>
                <td> { props.ride.date_requested.toString().slice(11,19) } </td>
                <td> {props.ride.connect_type } </td>
                <td> {props.ride.passengers_number } </td>
                <td> { props.ride.fare } </td>
                <td> { props.ride.passenger_phone_number } </td>
                <td> { props.ride.taxi_number } </td>
                <td> { props.ride.carTypeSelected } </td>
                {/*<td> { props.ride.driver_name } </td> */}
            </tr>
        </>
    )
}


export default function CancelledRides() {

    let [cancelledRides, setCancelledRides] = useState([])

    useEffect(() => {
        const interval = setInterval(() => {
            console.log("counting.... ")
            
            socket.on("getCancelledRides-passenger-feedback", (data) => {
                if((data !== undefined) && (data != null)) {
                    //Update cancelledRides
                    console.log(data)
                    setCancelledRides(data)
                }
            })
            socket.emit("getCancelledRides-passenger", {data: "get cancelled rides"})
        }, 2000)

        return( () => {
            clearInterval(interval)
        })

    },[
        cancelledRides
    ])
    // List of cancelled rides
    const cancelledRidesList = () => {
        return cancelledRides.map((ride) => {
            return <CancelledRideRow ride={ride} />
        })
    }

    const style = {
        header: {
            textAlign: "center",
            margin: "2%",
            padding: "1%"
        }
    }

  return (
    <div className="template">
        <div className="sidebar">
            <Sidebar />
        </div>
        <div className="main-content">
            <h1 style={ style.header }> CANCELLED RIDES </h1>
          
            <table className="table-striped" style={{ textAlign: "center"}}>
                <thead className="thead-light">
                    <tr>
                        
                        <th>Username</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Date</th>
                        <th>Time requested</th>
                        <th>Connect type</th>
                        <th>Passengers</th>
                        <th>Fare</th>
                        <th>Passenger cellphone</th>
                        <th>Taxi number</th>
                        <th>Car Type</th>
                        {/*<th>Driver name</th>*/}
                        
                    </tr>
                </thead>
                <tbody>
                    { cancelledRidesList() }
                </tbody>
            </table>
        </div>
    </div>
  )
}
