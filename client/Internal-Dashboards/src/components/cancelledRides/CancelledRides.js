import React, { Component } from "react";
import classes from "./cancelledTrips.module.css";
import { AiTwotoneCheckSquare, AiTwotoneCompass } from "react-icons/ai";
import { MdLock, MdLockOpen } from "react-icons/md";
import Loader from "react-loader-spinner";
import SOCKET_CORE from "../socket";

export default class CancelledRides extends Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      cancelledData: { data: [] },
      region: "Khomas",
      isLoading: true,
      reason: "All",
      sorting: "recentFirst",
    };
  }

  componentDidMount() {
    let that = this;

    this.getCancelledData();

    //Hand socket io responses
    this.SOCKET_CORE.on("getCancelledRides-passenger-feedback", (data) => {
      if (data !== undefined && data != null) {
        //Update cancelledRides
        if (that.state.cancelledData.stateHash !== data.stateHash) {
          that.setState({ cancelledData: data, isLoading: false });
        }
      } //Reset
      else {
        that.setState({ cancelledData: { data: [], isLoading: false } });
      }
    });
  }

  getCancelledData() {
    let that = this;
    this.intervalPersister = setInterval(function () {
      that.SOCKET_CORE.emit("getCancelledRides-passenger", {
        data: "get cancelled rides",
        region: that.state.region,
        reason: that.state.reason,
        sorting: that.state.sorting,
      });
    }, 2000);
  }

  renderCancelledNode() {
    return this.state.cancelledData.data !== undefined &&
      this.state.cancelledData.data !== null ? (
      this.state.cancelledData.data.map((trip, index) => {
        return (
          <div className={classes.cancelledNode}>
            <div style={{ width: 50 }}>{index + 1}</div>
            <div
              style={{
                flex: 1,
                backgroundColor: "#fff",
                border: "1px solid #d0d0d0",
              }}
            >
              <div className={classes.stage1Details}>
                <div className={classes.detailsNode}>
                  <div className={classes.locationTypical}>
                    <div className={classes.labelLocation}>
                      <AiTwotoneCompass style={{ width: 7, height: 7 }} />{" "}
                      Pickup
                    </div>
                    <div className={classes.subTextName}>
                      {trip.origin !== false ? trip.origin : "Unknown"}
                    </div>
                  </div>
                  <div className={classes.locationTypical}>
                    <div className={classes.labelLocation}>
                      <AiTwotoneCheckSquare style={{ width: 7, height: 7 }} />{" "}
                      Dropoff
                    </div>
                    <div className={classes.subTextName}>
                      {trip.destination.map((dest) => {
                        return <div>{dest !== false ? dest : "Unknown"}</div>;
                      })}
                    </div>
                  </div>
                </div>
                {/* Dates */}
                <div>
                  <div className={classes.labelDates}>Date requested</div>
                  <div className={classes.dateInfos}>
                    {new Date(trip.date_requested).toLocaleDateString()} at{" "}
                    {new Date(trip.date_requested).toLocaleTimeString()}
                  </div>

                  <div className={classes.labelDates}>Date cancelled</div>
                  <div className={classes.dateInfos}>
                    {new Date(trip.date_cancelled).toLocaleDateString()} at{" "}
                    {new Date(trip.date_cancelled).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {/* Stage 2 - user and trip infos */}
              <div className={classes.stage2Details}>
                {/* User infos */}
                <div>
                  <div className={classes.labelDates}>Name</div>
                  <div className={classes.dateInfos}>{trip.passenger_name}</div>
                  <div className={classes.labelDates}>Surname</div>
                  <div className={classes.dateInfos}>
                    {trip.passenger_surname}
                  </div>
                  <div className={classes.labelDates}>Gender</div>
                  <div className={classes.dateInfos}>
                    {trip.passenger_gender}
                  </div>
                  <div className={classes.labelDates}>Phone</div>
                  <div className={classes.dateInfos}>
                    {trip.passenger_phone_number}
                  </div>
                </div>
                {/* Trip infos */}
                <div>
                  <div className={classes.labelDates}>Passengers</div>
                  <div className={classes.dateInfos}>
                    {trip.passengers_number}
                  </div>
                  <div className={classes.labelDates}>Fare</div>
                  <div
                    className={classes.dateInfos}
                    style={{ fontFamily: "MoveBold", color: "#09864A" }}
                  >
                    N${trip.fare}
                  </div>
                  <div className={classes.labelDates}>Connect type</div>
                  <div className={classes.dateInfos}>{trip.connect_type}</div>
                  <div className={classes.labelDates}>Car type</div>
                  <div className={classes.dateInfos}>
                    {trip.carTypeSelected}
                  </div>
                </div>
                {/* Pickup note and cancellation reason */}
                <div>
                  <div className={classes.labelDates}>Pickup note</div>
                  <div className={classes.dateInfos}>{trip.pickupNote}</div>
                  <div className={classes.labelDates}>Cancellation reason</div>
                  <div
                    className={classes.dateInfos}
                    style={{ color: "#b22222" }}
                  >
                    {trip.cancellationReason}
                  </div>
                </div>
              </div>
              {/* Stage 3 - driver infos */}
              <div className={classes.stage3Details}>
                <div className={classes.headerInfos}>Driver infos</div>
                {trip.taxi_number !== "N/A" ? (
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <div style={{ width: 150 }}>
                      <div className={classes.labelDates}>Name</div>
                      <div className={classes.dateInfos}>
                        {trip.driver_name}
                      </div>
                      <div className={classes.labelDates}>Surname</div>
                      <div className={classes.dateInfos}>
                        {trip.driver_surname}
                      </div>
                    </div>
                    {/* Taxi no */}
                    <div>
                      <div className={classes.labelDates}>Taxi number</div>
                      <div className={classes.dateInfos}>
                        {trip.taxi_number}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: "MoveTextLight", fontSize: 13 }}>
                    No drivers was associated to this ride at the time of
                    cancel.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div></div>
    );
  }

  render() {
    return (
      <div
        style={{
          padding: "10px",
          marginTop: "10px",
          overflowX: "hidden",
        }}
      >
        {" "}
        <div className={classes.headerGeneric}>
          <div>
            <div>Cancelled rides</div>
            <div style={{ fontFamily: "MoveTextRegular", fontSize: 14 }}>
              {this.state.cancelledData.data !== undefined &&
              this.state.cancelledData.data !== null
                ? this.state.cancelledData.data.length
                : 0}{" "}
              rides shown
            </div>
          </div>
          <div
            style={{
              // border: "1px solid black",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <div className={classes.dayZoomLabel} style={{ marginRight: 15 }}>
              <div className={classes.labelDates}>Region</div>
              <select
                value={this.state.region}
                onChange={(val) => {
                  this.setState({
                    region: val.target.value,
                    isLoading: true,
                    cancelledData: { data: [] },
                  });
                }}
              >
                <option value="Khomas">Khomas</option>
                <option value="Erongo">Erongo</option>
              </select>
            </div>
            {/* Cancellation reason */}
            <div className={classes.dayZoomLabel} style={{ marginRight: 15 }}>
              <div className={classes.labelDates}>Reason</div>
              <select
                value={this.state.reason}
                onChange={(val) => {
                  this.setState({
                    reason: val.target.value,
                    isLoading: true,
                    cancelledData: { data: [] },
                  });
                }}
              >
                <option value="All">All</option>
                <option value="No available driver">No available driver</option>
                <option value="Driver too close">Driver too close</option>
                <option value="Change of plans">Change of plans</option>
                <option value="Driver too far">Driver too far</option>
                <option value="Just testing">Just testing</option>
              </select>
            </div>
            {/* Sorting */}
            <div className={classes.dayZoomLabel}>
              <div className={classes.labelDates}>Sorting</div>
              <select
                value={this.state.sorting}
                onChange={(val) => {
                  this.setState({
                    sorting: val.target.value,
                    isLoading: true,
                    cancelledData: { data: [] },
                  });
                }}
              >
                <option value="recentFirst">Most recents first</option>
                <option value="oldFirst">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          {/* Data */}
          {this.state.isLoading ? (
            <div
              style={{
                // border: "1px solid black",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
              }}
            >
              <Loader
                type="TailSpin"
                color="#000"
                height={35}
                width={35}
                timeout={300000000} //3 secs
              />
            </div>
          ) : (
            this.renderCancelledNode()
          )}
        </div>
      </div>
    );
  }
}
