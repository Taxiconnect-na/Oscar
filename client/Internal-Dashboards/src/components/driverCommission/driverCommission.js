import React, { useEffect, useState } from "react";
import socket from "../socket";
import Sidebar from "../sidebar/sidebar";
import "./driverCommission.css";

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

const DriverRow = (props) => {
  const redirectDriverPayment = () => {
    window.location = `/driver-commission-payment?driver_identifier=${props.driver.driver_fingerprint}&taxi=${props.driver.taxi_number}&&dname=${props.driver.name}&&dsurname=${props.driver.surname}`;
  };

  let todayStyle;
  let commissionStyle;

  if (isToday(new Date(props.driver.scheduled_payment_date))) {
    todayStyle = {
      backgroundColor: "#c43737",
    };
  } else {
    todayStyle = {
      border: "solid 0.5px",
    };
  }

  if (props.driver.total_commission >= 20) {
    commissionStyle = {
      backgroundColor: "green",
      color: "white",
    };
  }

  return (
    <tr
      onClick={() => {
        redirectDriverPayment();
      }}
      style={todayStyle}
    >
      <td>{props.driver.name}</td>
      <td>{props.driver.surname}</td>
      <td>
        <strong>{props.driver.phone_number}</strong>
      </td>
      <td>{props.driver.taxi_number}</td>
      <td style={commissionStyle}>
        <strong>{props.driver.total_commission}</strong>
      </td>
      <td> {props.driver.wallet_balance}</td>
      <td>
        <strong>
          {props.driver.scheduled_payment_date.toString().slice(0, 10)}
        </strong>
      </td>
    </tr>
  );
};

/**
 * * MAIN FUNCTION
 * @returns
 */
export default function DriverCommission() {
  let [drivers, setDrivers] = useState([]);

  useEffect(() => {
    //const interval = setInterval(() => {
    ("driverslistCommission@taxiconnect");

    socket.on("getDriversWithCommission-response", (data) => {
      if (data !== undefined && data != null) {
        ("received", data)(data);
        //mydata = data
        setDrivers(data);
      }
    });
    //...
    socket.emit("getDriversWithCommission", {
      data: "getting drivers commission",
    });
    /*}, 9000)
        
        return( () => {
            clearInterval(interval)
        }) */
  }, [drivers]);

  const driverData = () => {
    if (drivers.length > 0) {
      return drivers.map((driver) => {
        return <DriverRow driver={driver} />;
      });
    } else {
    }
  };

  return (
    <div>
      <div className="template">
        <div className="main-content">
          <h1 style={{ display: "grid", placeItems: "center", margin: "2%" }}>
            {" "}
            DRIVERS PAYMENTS{" "}
          </h1>

          <table
            className="table-hover"
            style={{ border: "solid 1px", marginBottom: "2%" }}
          >
            <thead className="thead-light">
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Phone </th>
                <th>Taxi Number</th>
                <th>Total commission</th>
                <th>Wallet Balance</th>
                <th>Scheduled payment date</th>
              </tr>
            </thead>
            <tbody>{driverData()}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
