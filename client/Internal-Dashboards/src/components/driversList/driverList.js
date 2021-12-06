import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import socket from "../socket";
import "./driverList.css";
import { FaUserAlt } from "react-icons/fa";
require("dotenv").config({ path: "../../../.env" });

function OnlineDrivers(driverArray, resolve) {
  let onlineDrivers = driverArray.filter((member) => {
    return member.status === "online";
  });

  resolve(onlineDrivers);
}

const DriverRow = (props) => {
  const redirectDriver = () => {
    window.location = `/drivers-update?driverID=${props.driver.driver_fingerprint}&taxi=${props.driver.taxi_number}&&dname=${props.driver.name}&&dsurname=${props.driver.surname}&&dplate_number=${props.driver.plate_number}&&brand=${props.driver.car_brand}&&contact=${props.driver.phone_number}&&taxipicture=${props.driver.taxi_picture}`;
  };
  return (
    <tr onClick={() => redirectDriver()}>
      <td>
        <FaUserAlt size={30} />
      </td>
      <td>{props.driver.name}</td>
      <td>{props.driver.surname}</td>
      <td>{props.driver.phone_number}</td>
      <td>{props.driver.taxi_number}</td>
      <td>{props.driver.plate_number}</td>
      <td>{props.driver.car_brand}</td>
      <td
        style={{
          color: "white",
          backgroundColor: props.index <= 100 ? "green" : "red",
        }}
      >
        {props.driver.status}
      </td>
      <td
        style={{
          color: "white",
          backgroundColor: props.index <= 100 ? "green" : "red",
        }}
      >
        {props.driver.isDriverSuspended ? "YES" : "NO"}
      </td>
      <td>{props.driver.totalMoneyToday}</td>
      <td>{props.driver.todaytrip}</td>
    </tr>
  );
};

function DriverList() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  //let ENDPOINT = process.env.GATEWAY
  let [drivers, setDrivers] = useState([]);
  let [online_drivers_count, setOnlineDriversCount] = useState(0);

  useEffect(
    () => {
      /* let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    //upgrade: true,
                                    reconnectionAttempts: Infinity})  */
      //const interval = setInterval(() => {
      socket.on("getDrivers-response", (data) => {
        if (data !== undefined && data != null) {
          //mydata = data
          setDrivers(data);
          new Promise((res) => {
            OnlineDrivers(data, res);
          })
            .then((result) => {
              setOnlineDriversCount(result.length);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      });
      //...
      socket.emit("getDrivers", { data: "getting drivers" });
      /*}, 15000)
        
        return( () => {
            clearInterval(interval)
        }) */
    },
    [
      // Re-render whenever any of the following variables changes
    ]
  );

  const driverData = () => {
    return drivers.map((driver, index) => {
      return <DriverRow driver={driver} index={index} />;
    });
  };
  const title_style = {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 15,
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    return (
      <div>
        <div className="template">
          <div className="main-content">
            <h1 style={title_style}>Registered drivers</h1>
            <hr></hr>
            <div id="container-driver">
              <div>
                <h1
                  style={{ fontSize: "large", color: "black", width: "auto" }}
                >
                  {" "}
                  Currently registered:
                  <span style={{ fontSize: "large", color: "blue" }}>
                    {" "}
                    367{" "}
                  </span>
                </h1>
              </div>
              <div>
                <h1
                  style={{ fontSize: "large", color: "black", width: "auto" }}
                >
                  {" "}
                  Online:
                  <span style={{ fontSize: "large", color: "blue" }}>
                    {" "}
                    100{" "}
                  </span>
                </h1>
              </div>
            </div>
            <hr></hr>
            <table className="table-striped" style={{ margin: 15 }}>
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
                  <th>Suspended</th>
                  <th>Daily profit</th>
                  <th>Daily connect</th>
                </tr>
              </thead>
              <tbody>{driverData()}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default DriverList;
