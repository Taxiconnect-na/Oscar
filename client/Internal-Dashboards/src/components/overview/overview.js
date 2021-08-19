import React, { useState, useEffect } from "react";
//import axios from "axios"
//import io from 'socket.io-client'
import socket from "../socket";
import Sidebar from "../sidebar/sidebar";
import "./overview.css";
require("dotenv").config({ path: "../../../.env" });

function Overview() {
  // Initialize statistics state
  let [totalFareSuccessful, setTotalFareSuccessful] = useState(0);
  let [totalTripSuccessful, setTotalTripSuccessful] = useState(0);
  let [totalFareCancelled, setTotalFareCancelled] = useState(0);
  let [totalTripCancelled, setTotalTripCancelled] = useState(0);
  let [totalFareSuccessfulToday, setTotalFareSuccessfulToday] = useState(0);
  let [totalTripSuccessfulToday, setTotalTripSuccessfulToday] = useState(0);
  let [totalFareCancelledToday, setTotalFareCancelledToday] = useState(0);
  let [totalTripCancelledToday, setTotalTripCancelledToday] = useState(0);
  let [totalNewDriverToday, setTotalNewDriverToday] = useState(0);
  let [totalNewPassengerToday, setTotalNewPassengerToday] = useState(0);
  let [totalCash, setTotalCash] = useState(0);
  let [totalWallet, setTotalWallet] = useState(0);
  //let ENDPOINT = process.env.GATEWAY
  //var ENDPOINT = "localhost:10014"

  useEffect(() => {
    /*let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    //upgrade: true,
                                    reconnectionAttempts: Infinity})  */

    //const interval = setInterval(() => {
    console.log("mack@taxiconnect");
    socket.on("statistics-response", (data) => {
      //mydata = data
      setTotalFareSuccessful(data["totalFareSuccessful"]);
      setTotalTripSuccessful(data["totalTripSuccessful"]);
      setTotalFareCancelled(data["totalFareCancelled"]);
      setTotalTripCancelled(data["totalTripCancelled"]);
      setTotalFareSuccessfulToday(data["totalFareSuccessfulToday"]);
      setTotalTripSuccessfulToday(data["totalTripSuccessfulToday"]);
      setTotalFareCancelledToday(data["totalFareCancelledToday"]);
      setTotalTripCancelledToday(data["totalTripCancelledToday"]);
      setTotalNewDriverToday(data["totalNewDriverToday"]);
      setTotalNewPassengerToday(data["totalNewPassengerToday"]);
      setTotalCash(data["totalCash"]);
      setTotalWallet(data["totalWallet"]);
    });
    //...
    socket.emit("statistics", { data: "specs" });
    /*}, 20000)

        return( () => {
            clearInterval(interval)
        })*/
  }, [
    // Re-render whenever any of the following variables changes
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
  ]);

  return (
    <div className="template">
      <div style={{ backgroundColor: "#03162e" }} className="main-content">
        <div>
          <div id="top">
            <h1>SUMMARY</h1>
            <hr style={{ width: "60%", margin: "auto" }}></hr>
          </div>
          <div id="title">
            <h2>TODAY </h2>
          </div>

          <div className="content-overview">
            <div>
              <h1 style={{ fontSize: "xx-large", color: "#0d17a8" }}>
                {totalTripSuccessfulToday}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  successful trip
                </span>
              </h1>
              <h1 style={{ fontSize: "xx-large", color: "#a60a0a" }}>
                {totalTripCancelledToday}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  cancelled trip
                </span>
              </h1>
            </div>

            <div>
              <h1 style={{ fontSize: "xx-large", color: "#0d17a8" }}>
                N$ {totalFareSuccessfulToday}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  processed{" "}
                </span>
              </h1>
              <h1 style={{ fontSize: "xx-large", color: "#a60a0a" }}>
                N$ {totalFareCancelledToday}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  lost{" "}
                </span>
              </h1>
            </div>
          </div>

          <div style={{ width: "50%", alignContent: "center", margin: "auto" }}>
            <table
              className="table-bordered"
              style={{ border: "1px solid #205a8a", color: "white" }}
            >
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
                  <td>{totalNewPassengerToday}</td>
                  <td>{totalNewDriverToday}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <br></br>
          <hr></hr>

          <div id="title">
            <h2>OVERALL </h2>
          </div>
          <div className="content-overview">
            <div style={{ backgroundColor: "#8d9294" }}>
              <h1 style={{ fontSize: "xx-large", color: "#0d17a8" }}>
                {totalTripSuccessful}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  successful trip
                </span>
              </h1>
              <h1 style={{ fontSize: "xx-large", color: "#a60a0a" }}>
                {totalTripCancelled}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  cancelled trip
                </span>
              </h1>
            </div>

            <div style={{ backgroundColor: "#8d9294" }}>
              <h1 style={{ fontSize: "xx-large", color: "#0d17a8" }}>
                N$ {totalFareSuccessful}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  processed{" "}
                </span>
              </h1>
              <h1 style={{ fontSize: "xx-large", color: "#a60a0a" }}>
                N$ {totalFareCancelled}
                <span style={{ fontSize: "small", color: "black" }}>
                  {" "}
                  lost{" "}
                </span>
              </h1>
            </div>
          </div>

          <div style={{ width: "55%", alignContent: "center", margin: "auto" }}>
            <table className="table-hover" style={{ color: "white" }}>
              <thead className="thead-dark">
                <tr>
                  <th colSpan="2">Processed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>cash</td>
                  <td>N$ {totalCash}</td>
                </tr>
                <tr>
                  <td>wallet</td>
                  <td>N$ {totalWallet}</td>
                </tr>
                <tr>
                  <td>Total</td>
                  <td>N$ {totalCash + totalWallet}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <br></br>
        </div>
      </div>
    </div>
  );
}

export default Overview;
