import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/sidebar";
//import io from 'socket.io-client'
import socket from "../socket";

const CancelledRideRow = (props) => {
  const dest = () => {
    return props.ride.destination.map((place) => {
      return (
        <ul>
          <li>{place}</li>
        </ul>
      );
    });
  };

  let isRideExisting;
  if (props.ride.isRideExisting) {
    isRideExisting = "YES";
  } else {
    isRideExisting = "NO";
  }

  const isRideExisting_style = {
    yes: {
      backgroundColor: "green",
      color: "white",
    },
    no: {
      backgroundColor: "red",
      color: "white",
    },
  };

  return (
    <>
      <tr>
        <td> {props.ride.taxi_number} </td>
        <td> {props.ride.driver_name} </td>
        <td> {props.ride.driver_phone_number} </td>
        <td
          style={
            props.ride.isRideExisting
              ? isRideExisting_style.yes
              : isRideExisting_style.no
          }
        >
          {" "}
          {isRideExisting}{" "}
        </td>
        {/*<td> { props.ride.date_requested.toString().slice(0,10) } | { props.ride.date_requested.toString().slice(11,19) } </td>
                <td> { props.ride.cancelled.toString().slice(0,10) } | { props.ride.cancelled.toString().slice(11,19) } </td>
                */}
        <td>
          {" "}
          {props.ride.date_requested.toString().slice(0, 10)} |{" "}
          {props.ride.date_requested.toString().slice(11, 19)}{" "}
        </td>
        <td>
          {" "}
          {props.ride.date_cancelled.toString().slice(0, 10)} |{" "}
          {props.ride.date_cancelled.toString().slice(11, 19)}{" "}
        </td>
        <td> {props.ride.passenger_name} </td>
        <td> {props.ride.passenger_phone_number} </td>
        <td> {props.ride.origin} </td>
        <td> {dest()} </td>
        <td> {props.ride.connect_type} </td>
        <td>
          {" "}
          {props.ride.fare} [{props.ride.passengers_number}]{" "}
        </td>
      </tr>
    </>
  );
};

export default function CancelledRidesDrivers() {
  let [cancelledRides, setCancelledRides] = useState([]);

  useEffect(() => {
    //const interval = setInterval(() => {

    socket.on("getCancelledRides-drivers-feedback", (data) => {
      if (data !== undefined && data != null) {
        //Update cancelledRides
        setCancelledRides(data.data);
      }
    });
    socket.emit("getCancelledRides-drivers", {
      data: "get cancelled rides by drivers",
    });

    /*}, 2000)

        return( () => {
            clearInterval(interval)
        })*/
  }, [cancelledRides]);
  // List of cancelled rides
  const cancelledRidesList = () => {
    return cancelledRides.map((ride) => {
      return <CancelledRideRow ride={ride} />;
    });
  };

  const style = {
    header: {
      textAlign: "center",
      margin: "2%",
      padding: "1%",
    },
  };

  return (
    <div className="template">
      <div className="sidebar">
        <Sidebar />
      </div>
      <div className="main-content">
        <h1 style={style.header}> CANCELLED RIDES BY DRIVERS </h1>

        <table className="table-striped" style={{ textAlign: "center" }}>
          <thead className="thead-light">
            <tr>
              <th>Taxi number</th>
              <th>Driver name</th>
              <th>Driver cellphone</th>
              <th>Ride Exists</th>
              <th>Date | Time requested</th>
              <th>Date | Time cancelled</th>
              <th>Passenger name</th>
              <th>Passenger cellphone</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Connect Type</th>
              <th>Fare [Passengers] </th>
            </tr>
          </thead>
          <tbody>{cancelledRidesList()}</tbody>
        </table>
      </div>
    </div>
  );
}
