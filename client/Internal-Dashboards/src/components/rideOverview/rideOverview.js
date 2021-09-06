import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import socket from "../socket";
import "./rideOverview.css";
import { GrStatusWarningSmall } from "react-icons/gr";

require("dotenv").config({ path: "../../../.env" });

/**
 *
 * @function RideRow : Returns single ride details
 */

const RideRow = (props) => {
  let statepick;
  let statepickword;
  let statedrop;
  let statedropword;
  let [details, setDetails] = useState(false);
  let detailButton = details ? "less" : "more";

  if (props.ride.isDroppedDriver === true) {
    statedrop = { backgroundColor: "green" };
    statedropword = "YES";
  } else {
    statedrop = { backgroundColor: "red" };
    statedropword = "NO";
  }

  if (props.ride.isPickedUp === true) {
    statepick = { backgroundColor: "green" };
    statepickword = "YES";
  } else {
    statepick = { backgroundColor: "red" };
    statepickword = "NO";
  }
  const listStyle = {
    border: "1px solid",
    listStyle: "none",
  };
  // Create a list of available destinations
  const dest = () => {
    return props.ride.destinations.map((d) => {
      return (
        <ul>
          <li style={listStyle}>{d.location_name}</li>
        </ul>
      );
    });
  };
  const iconStyle = {
    width: "40%",
  };

  return (
    <>
      <tr style={{ backgroundColor: "#ebd113" }}>
        <td>
          <GrStatusWarningSmall
            style={iconStyle}
            data-bs-toggle="modal"
            data-bs-target="#myModal"
          />

          <div
            className="modal fade"
            id="myModal"
            tabindex="-1"
            aria-labelledby="myModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="myModalLabel">
                    Actions
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <h3>
                    <i>No action available</i>
                  </h3>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          {props.ride.taxi_number}
        </td>
        <td>{props.ride.passengers_number}</td>
        <td>{props.ride.request_type}</td>
        <td>{props.ride.date_time.toString().slice(0, 10)}</td>
        <td>{props.ride.date_time.toString().slice(11, 19)}</td>
        <td style={statepick}>{statepickword}</td>
        <td style={statedrop}>{statedropword}</td>
        <td>{props.ride.connect_type}</td>
        <td>
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              setDetails(!details);
            }}
          >
            {detailButton}
          </button>
        </td>
      </tr>
      <tr style={{ display: details ? "" : "none" }}>
        <td className="data-table" colSpan={9}>
          <table
            className="table"
            style={{ textAlign: "center", width: "100%", margin: "auto" }}
            id="iner-table"
          >
            <thead className="thead-light">
              <tr>
                <th colSpan={9}>Passenger info</th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Cellphone</th>
                <th>Gender</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Origin</th>
                <th>Destination(s)</th>
                <th>Wished pick up time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-second">{props.ride.name}</td>
                <td className="td-second">{props.ride.surname}</td>
                <td className="td-second">{props.ride.cellphone}</td>
                <td className="td-second">{props.ride.gender}</td>
                <td className="td-second">{props.ride.payment_method}</td>
                <td className="td-second">N$ {props.ride.amount}</td>
                <td className="td-second">{props.ride.origin}</td>
                <td className="td-second">{dest()}</td>
                <td className="td-second">
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(0, 10)
                    : "unknown"}{" "}
                  @(
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(11, 19)
                    : "unknown"}
                  )
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );
};

/**
 *
 * @function RideRowProgress : Returns single ride details for rides in progress
 */

const RideRowProgress = (props) => {
  let statepick;
  let statepickword;
  let statedrop;
  let statedropword;
  let [details, setDetails] = useState(false);
  let detailButton = details ? "less" : "more";
  let [confirmRideState, setConfirmRideState] = useState(false);
  let [confirmRideError, setConfirmRideError] = useState(false);
  let [showConfirmState, setShowConfirmState] = useState(false);
  let [changeRideState, setChangeRideState] = useState(false);

  if (props.ride.isDroppedDriver === true) {
    statedrop = { backgroundColor: "green" };
    statedropword = "YES";
  } else {
    statedrop = { backgroundColor: "red" };
    statedropword = "NO";
  }

  if (props.ride.isPickedUp === true) {
    statepick = { backgroundColor: "green" };
    statepickword = "YES";
  } else {
    statepick = { backgroundColor: "red" };
    statepickword = "NO";
  }
  const listStyle = {
    border: "1px solid",
    listStyle: "none",
  };
  // Create a list of available destinations
  const dest = () => {
    return props.ride.destinations.map((d) => {
      return (
        <ul>
          <li style={listStyle}>{d.location_name}</li>
        </ul>
      );
    });
  };
  const iconStyle = {
    width: "40%",
  };
  const confirm_progress_style = {
    color: "orange",
  };
  const confirm_success_style = {
    color: "green",
  };
  const confirm_fail_style = {
    color: "red",
  };

  const confirmRide = () => {
    // show progress of confirmation request
    //setShowConfirmState(true)
    setChangeRideState(true);
    socket.on("ConfirmRide-feedback", (data) => {
      if (data.success) {
        // Show successful confirmation
        //setChangeRideState(true)
        console.log(
          "inoinoinoinnoinnioninoiiiiiiiiiiiiiiiiiiiiiiiiiiooioiiooiiooinnioionnoinoiubbhjb"
        );
      } else if (!data.success) {
        //Do not show progress and display error message
        //setShowConfirmState(false)
        //setConfirmRideError(true)
        console.log(
          "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
        );
      }
    });
    socket.emit("ConfirmRide", { request_fp: props.ride.request_fp });
    //console.log(props.ride.ride_id)
  };

  const cancellRide = () => {
    // show progress of confirmation request
    //setShowConfirmState(true)

    socket.emit("CancellTrip", { request_fp: props.ride.request_fp });
    socket.on("CancellTrip-feedback", (data) => {
      if (data.success) {
        // Show successful confirmation
        //setConfirmRideState(true)
        console.log(
          "inoinoinoinnoinnioninoiiiiiiiiiiiiiiiiiiiiiiiiiiooioiiooiiooinnioionnoinoiubbhjb"
        );
      } else if (data.success === false) {
        //Do not show progress and display error message
        //setShowConfirmState(false)
        //setConfirmRideError(true)
        console.log(
          "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
        );
      }
    });

    //console.log(props.ride.ride_id)
  };

  return (
    <>
      <tr style={{ backgroundColor: "#ebd113" }}>
        <td>{props.ride.taxi_number}</td>
        <td>{props.ride.passengers_number}</td>
        <td>{props.ride.request_type}</td>
        <td>{props.ride.date_time.toString().slice(0, 10)}</td>
        <td>{props.ride.date_time.toString().slice(11, 19)}</td>
        <td style={statepick}>{statepickword}</td>
        <td style={statedrop}>{statedropword}</td>
        <td>{props.ride.connect_type}</td>
        <td colSpan={2}>
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              setDetails(!details);
            }}
          >
            {detailButton}
          </button>
        </td>
      </tr>
      <tr style={{ display: details ? "" : "none" }}>
        <td className="data-table" colSpan={10}>
          <table
            className="table"
            style={{ textAlign: "center", width: "100%", margin: "auto" }}
            id="iner-table"
          >
            <thead className="thead-light">
              <tr>
                <th colSpan={10}>Passenger info</th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Cellphone</th>
                <th>Gender</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Origin</th>
                <th>Destination(s)</th>
                <th>Wished pick up time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-second">{props.ride.name}</td>
                <td className="td-second">{props.ride.surname}</td>
                <td className="td-second">{props.ride.cellphone}</td>
                <td className="td-second">{props.ride.gender}</td>
                <td className="td-second">{props.ride.payment_method}</td>
                <td className="td-second">N$ {props.ride.amount}</td>
                <td className="td-second">{props.ride.origin}</td>
                <td className="td-second">{dest()}</td>
                <td className="td-second">
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(0, 10)
                    : "unknown"}{" "}
                  @(
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(11, 19)
                    : "unknown"}
                  )
                </td>
                <td>
                  <div className="action-buttons">
                    {!changeRideState ? (
                      <div>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            confirmRide();
                          }}
                          style={{ marginBottom: "9%" }}
                        >
                          confirm
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            cancellRide();
                          }}
                        >
                          delete
                        </button>
                      </div>
                    ) : (
                      <div>
                        <bold style={{ color: "red" }}>In progress ...</bold>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );
};

/**
 *
 * @function RideRowScheduled : Returns single ride details for scheduled rides
 */

const RideRowScheduled = (props) => {
  let statepick;
  let statepickword;
  let statedrop;
  let statedropword;
  let [details, setDetails] = useState(false);
  let detailButton = details ? "less" : "more";

  if (props.ride.isDroppedDriver === true) {
    statedrop = { backgroundColor: "green" };
    statedropword = "YES";
  } else {
    statedrop = { backgroundColor: "red" };
    statedropword = "NO";
  }

  if (props.ride.isPickedUp === true) {
    statepick = { backgroundColor: "green" };
    statepickword = "YES";
  } else {
    statepick = { backgroundColor: "red" };
    statepickword = "NO";
  }
  const listStyle = {
    border: "1px solid",
    listStyle: "none",
  };
  // Create a list of available destinations
  const dest = () => {
    return props.ride.destinations.map((d) => {
      return (
        <ul>
          <li style={listStyle}>{d.location_name}</li>
        </ul>
      );
    });
  };
  const iconStyle = {
    width: "40%",
  };

  return (
    <>
      <tr style={{ backgroundColor: "#ebd113" }}>
        <td>
          <GrStatusWarningSmall
            style={iconStyle}
            data-bs-toggle="modal"
            data-bs-target="#scheduledModal"
          />

          <div
            className="modal fade"
            id="scheduledModal"
            tabindex="-1"
            aria-labelledby="scheduledModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="scheduledModalLabel">
                    Modal title
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <button className="btn btn-primary btn-sm">confirm</button>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          {props.ride.taxi_number}
        </td>
        <td>{props.ride.passengers_number}</td>
        <td>{props.ride.request_type}</td>
        <td>{props.ride.date_time.toString().slice(0, 10)}</td>
        <td>{props.ride.date_time.toString().slice(11, 19)}</td>
        <td style={statepick}>{statepickword}</td>
        <td style={statedrop}>{statedropword}</td>
        <td>{props.ride.connect_type}</td>
        <td>
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              setDetails(!details);
            }}
          >
            {detailButton}
          </button>
        </td>
      </tr>
      <tr style={{ display: details ? "" : "none" }}>
        <td className="data-table" colSpan={10}>
          <table
            className="table"
            style={{ textAlign: "center", width: "100%", margin: "auto" }}
            id="iner-table"
          >
            <thead className="thead-light">
              <tr>
                <th colSpan={10}>Passenger info</th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Cellphone</th>
                <th>Gender</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Origin</th>
                <th>Destination(s)</th>
                <th>Wished pick up time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-second">{props.ride.name}</td>
                <td className="td-second">{props.ride.surname}</td>
                <td className="td-second">{props.ride.cellphone}</td>
                <td className="td-second">{props.ride.gender}</td>
                <td className="td-second">{props.ride.payment_method}</td>
                <td className="td-second">N$ {props.ride.amount}</td>
                <td className="td-second">{props.ride.origin}</td>
                <td className="td-second">{dest()}</td>
                <td className="td-second">
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(0, 10)
                    : "unknown"}{" "}
                  @(
                  {props.ride.wished_pickup_time
                    ? props.ride.wished_pickup_time.toString().slice(11, 19)
                    : "unknown"}
                  )
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );
};

/**
 * @function RideOverview : Main function rendering the rides overview page
 */

function RideOverview() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  let [rides, setRides] = useState([]); // Main ride list of objects
  let [inProgress, setInProgress] = useState(true);
  let [RidesInProgressCountToday, setRidesInProgressCountToday] = useState(0);
  let [scheduled, setScheduled] = useState(false);
  let [completed, setCompleted] = useState(false);
  let [InprogressCount, setInProgressCount] = useState(0);
  let [ScheduledCount, setScheduledCount] = useState(0);
  let [CompletedCount, setCompletedCount] = useState(0);
  let [CompletedTodayCount, setCompletedTodayCount] = useState(0);
  let [moneyInprogress, setMoneyInProgress] = useState({});
  let [moneyScheduled, setMoneyScheduled] = useState({});
  let [moneyCompleted, setMoneyCompleted] = useState({});
  let [moneyCompletedToday, setMoneyCompletedToday] = useState({});

  //var ENDPOINT = "http://192.168.8.151:10014/"

  useEffect(() => {
    /*let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    //upgrade: true,
                                    reconnectionAttempts: Infinity})  */
    const interval = setInterval(() => {
      console.log("kap@taxiconnect");
      socket.on("getRideOverview-response", (data) => {
        if (data !== undefined && data != null) {
          setRides(data);
        } else {
          console.log(data.error); // data.error ?
          alert("Something went wrong while retrieving Data");
        }
      });

      socket.on("getRideOverview-response-scatter", (future) => {
        if (future != undefined && future != null) {
          setInProgressCount(future.inprogress);
          setMoneyInProgress(future.moneyInprogress);
          setScheduledCount(future.scheduled);
          setMoneyScheduled(future.moneyScheduled);
          setCompletedCount(future.completed);
          setMoneyCompleted(future.moneyCompleted);
          setCompletedTodayCount(future.completed_today);
          setMoneyCompletedToday(future.moneyCompletedToday);
        }
      });
      socket.emit("getRideOverview", { data: "Get ride-overview Data!" });

      socket.on("get-trips-in-progress-count-feedback", (data) => {
        if (data != undefined && data != null) {
          setRidesInProgressCountToday(data.todayRidesProgressCount);
        }
      });
      socket.emit("get-trips-in-progress-count", {
        data: "Get rides in progress count today",
      });
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [
    // re-render whenever any of these changes
    rides,
  ]);

  /**
   * @function rideListInProgress : returns the list of rides in progress
   * @function rideListScheduled : returns the list of scheduled rides
   * @function rideListCompleted : returns the list of completed rides
   *
   */

  const rideListInProgress = () => {
    return rides.map((currentRide) => {
      if (!currentRide.isArrivedToDestination) {
        return <RideRowProgress ride={currentRide} />;
      } else {
        //! Do nothing (Do not add the ride to the list if not in progress)
      }
    });
  };

  const rideListScheduled = () => {
    return rides.map((currentRide) => {
      if (
        currentRide.request_type === "scheduled" &&
        currentRide.isArrivedToDestination === false
      ) {
        return <RideRowScheduled ride={currentRide} />;
      } else {
        //! Do nothing (Do not add the ride to the list if not scheduled)
      }
    });
  };

  const rideListCompleted = () => {
    return rides.map((currentRide) => {
      if (currentRide.isArrivedToDestination) {
        return <RideRow ride={currentRide} />;
      } else {
        //! Do nothing --> Do not add the ride to the list if not completed
        //! the ride is completed upon confirmation of either driver or passenger
        //! Further display difference of both shall be done upon rendering of the row
      }
    });
  };

  const title_style = {
    textAlign: "center",
    paddingTop: "2%",
    paddingBottom: "1%",
    color: "white",
    paddingLeft: "5.5%",
  };
  const subtitle_style = {
    textAlign: "center",
    marginTop: 5,
    marginBottom: 10,
    color: "white",
  };
  const card = {
    backgroundColor: "#62bbde",
  };
  const card_header = {
    backgroundColor: "#3183a3",
  };

  const today = () => {
    return (
      <div style={{ backgroundColor: "#064a52", marginTop: 0, padding: 15 }}>
        <h5 style={{ width: 35, margin: "auto", color: "white" }}>TODAY</h5>
        <div id="container-low">
          <div>
            <h1
              style={{ fontSize: "large", color: "white", textAlign: "center" }}
            >
              {" "}
              N$ {moneyCompletedToday["totalCash"]}
              <span style={{ fontSize: "small" }}> cash</span>
            </h1>
          </div>
          <div>
            <h1
              style={{ fontSize: "large", color: "white", textAlign: "center" }}
            >
              {" "}
              N$ {moneyCompletedToday["totalWallet"]}
              <span style={{ fontSize: "small" }}> wallet</span>
            </h1>
          </div>
          <div>
            <h1
              style={{ fontSize: "large", color: "white", textAlign: "center" }}
            >
              {" "}
              N$ {moneyCompletedToday["totalCashWallet"]}
              <span style={{ fontSize: "small" }}> total</span>
            </h1>
          </div>
          <div>
            <h1
              style={{ fontSize: "large", color: "white", textAlign: "center" }}
            >
              {" "}
              {CompletedTodayCount}
              <span style={{ fontSize: "small" }}> rides</span>
            </h1>
          </div>
        </div>
      </div>
    );
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    return (
      <div className="template">
        <div>
          <div style={{ backgroundColor: "#03162e" }}>
            <h1 style={title_style}> RIDES OVERVIEW</h1>
            <hr
              style={{
                width: "60%",
                color: "#ffffff",
                margin: "auto",
                padding: "1px",
              }}
            ></hr>

            <div className="ride-options">
              <div>
                <button
                  className="btn btn-info btn-sm "
                  onClick={() => {
                    setScheduled(false);
                    setCompleted(false);
                    setInProgress(true);
                  }}
                >
                  Rides in progress [{InprogressCount}]
                </button>
              </div>

              <div>
                <button
                  className="btn btn-info btn-sm "
                  onClick={() => {
                    setInProgress(false);
                    setCompleted(false);
                    setScheduled(true);
                  }}
                >
                  Scheduled rides [{ScheduledCount}]
                </button>
              </div>

              <div>
                <button
                  className="btn btn-info btn-sm "
                  onClick={() => {
                    setInProgress(false);
                    setCompleted(true);
                    setScheduled(false);
                  }}
                >
                  Completed rides [{CompletedCount}]
                </button>
              </div>
            </div>

            <div style={{ display: inProgress ? "" : "none" }}>
              <hr></hr>

              <div>
                <div className="container">
                  <div className="row text-center">
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          cash
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyInprogress["totalCash"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          wallet
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyInprogress["totalWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          Total
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyInprogress["totalCashWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr></hr>

              {today()}

              <h3 style={subtitle_style}>
                RIDES IN PROGRESS [ {RidesInProgressCountToday} ]
              </h3>

              <table className="table" style={{ textAlign: "center" }}>
                <thead className="thead-light">
                  <tr>
                    <th>Taxi number</th>
                    <th>Passengers</th>
                    <th>Request type</th>
                    <th>Date</th>
                    <th>Time requested</th>
                    <th>Client picked up</th>
                    <th>Driver drop-off confirmation</th>
                    <th>Connect type</th>
                    <th>...</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{rideListInProgress()}</tbody>
              </table>
            </div>

            <div style={{ display: scheduled ? "" : "none" }}>
              <hr></hr>
              <div>
                <div className="container">
                  <div className="row text-center">
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          cash
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyScheduled["totalCash"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          wallet
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyScheduled["totalWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          Total
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyScheduled["totalCashWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr></hr>

              {today()}

              <h3 style={subtitle_style}>SCHEDULED RIDES </h3>
              <table className="table" style={{ textAlign: "center" }}>
                <thead className="thead-light">
                  <tr>
                    <th>Taxi number</th>
                    <th>Passengers</th>
                    <th>Request type</th>
                    <th>Date</th>
                    <th>Time requested</th>
                    <th>Client picked up</th>
                    <th>Driver dropped off confirmation</th>
                    <th>Connect type</th>
                    <th>...</th>
                  </tr>
                </thead>
                <tbody>{rideListScheduled()}</tbody>
              </table>
            </div>

            <div style={{ display: completed ? "" : "none" }}>
              <hr></hr>

              <div>
                <div className="container">
                  <div className="row text-center">
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          cash
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyCompleted["totalCash"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          wallet
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyCompleted["totalWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm">
                      <div className="card" style={card}>
                        <div className="card-header" style={card_header}>
                          Total
                        </div>
                        <div className="card-body">
                          <h3>N$ {moneyCompleted["totalCashWallet"]}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr></hr>

              {today()}

              <h3 style={subtitle_style}>COMPLETED RIDES</h3>
              <table className="table" style={{ textAlign: "center" }}>
                <thead className="thead-light">
                  <tr>
                    <th>Taxi number</th>
                    <th>Passengers</th>
                    <th>Request type</th>
                    <th>Date</th>
                    <th>Time requested</th>
                    <th>Client picked up</th>
                    <th>Driver dropped off confirmation</th>
                    <th>Connect type</th>
                    <th>...</th>
                  </tr>
                </thead>
                <tbody>{rideListCompleted()}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RideOverview;
