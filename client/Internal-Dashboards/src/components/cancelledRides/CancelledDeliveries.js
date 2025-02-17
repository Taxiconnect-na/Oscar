import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import socket from "../socket";

const CancelledDeliveryRow = (props) => {
  const dest = () => {
    return props.ride.destination.map((place) => {
      return (
        <ul>
          <li>{place}</li>
        </ul>
      );
    });
  };

  return (
    <>
      <tr>
        <td> {props.ride.passenger_name} </td>
        <td> {props.ride.origin} </td>
        <td> {dest()} </td>
        <td> {props.ride.date_requested.toString().slice(0, 10)} </td>
        <td> {props.ride.date_requested.toString().slice(11, 19)} </td>
        <td> {props.ride.fare} </td>
        <td> {props.ride.passenger_phone_number} </td>
        <td> {props.ride.taxi_number} </td>
        <td> {props.ride.carTypeSelected} </td>
        {/*<td> { props.ride.driver_name } </td> */}
      </tr>
    </>
  );
};

export default function CancelledDeliveries() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  let [cancelledRides, setCancelledRides] = useState([]);

  useEffect(() => {
    //const interval = setInterval(() => {

    socket.on("getCancelledDeliveries-passenger-feedback", (data) => {
      if (data !== undefined && data != null) {
        //Update cancelledRides
        setCancelledRides(data);
      }
    });
    socket.emit("getCancelledDeliveries-passenger", {
      data: "get cancelled rides",
    });
    /*}, 2000)

        return( () => {
            clearInterval(interval)
        })*/
  }, [cancelledRides]);
  // List of cancelled rides
  const cancelledRidesList = () => {
    return cancelledRides.map((ride) => {
      return <CancelledDeliveryRow ride={ride} />;
    });
  };

  const style = {
    header: {
      textAlign: "center",
      margin: "2%",
      padding: "1%",
    },
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    return (
      <div className="template">
        <div className="main-content">
          <h1 style={style.header}> CANCELLED DELIVERIES </h1>

          <table className="table-striped" style={{ textAlign: "center" }}>
            <thead className="thead-light">
              <tr>
                <th>Username</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Date</th>
                <th>Time requested</th>
                <th>Fare</th>
                <th>Passenger cellphone</th>
                <th>Taxi number</th>
                <th>Transport Type</th>
                {/*<th>Driver name</th>*/}
              </tr>
            </thead>
            <tbody>{cancelledRidesList()}</tbody>
          </table>
        </div>
      </div>
    );
  }
}
