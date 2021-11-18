import React, { Component } from "react";
import classes from "./Visualize.module.css";
import Select from "react-select";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateStatisticalBundleData } from "../../Redux/HomeActionsCreators";

const descriptionsDataFrames = {
  total_trips: {
    name: "Total trips",
    description:
      "These totals include the successful and cancelled trips made for ride or delivery requests.",
  },
  total_successful_trips: {
    name: "Total successful trips",
    description:
      "These are only the successful trips made for ride or delivery requests.",
  },
  total_cancelled_trips: {
    name: "Total cancelled trips",
    description:
      "These are only the cancelled trips made for ride or delivery requests.",
  },
  total_connectme_trips: {
    name: "Total ConnectMe trips",
    description:
      "These totals include the successful and cancelled ConnectMe trips made for ride or delivery requests.",
  },
  total_connectus_trips: {
    name: "Total ConnectUs trips",
    description:
      "These totals include the successful and cancelled ConnectUs trips made for ride or delivery requests.",
  },
  total_scheduled_trips: {
    name: "Total scheduled trips",
    description:
      "These totals include the successful and cancelled scheduled trips made for ride or delivery requests.",
  },
  total_immediate_trips: {
    name: "Total immediate trips",
    description:
      "These totals include the successful and cancelled immediate trips made for ride or delivery requests.",
  },
  total_cash_trips: {
    name: "Total cash trips",
    description:
      "These totals consider only the successful and cancelled trips made for ride or delivery requests using cash payment medthod.",
  },
  total_wallet_trips: {
    name: "Total wallet trips",
    description:
      "These totals consider only the successful and cancelled trips made for ride or delivery requests using wallet payment medthod.",
  },
  total_successful_rides: {
    name: "Total successful rides",
    description: "These are only the successful trips made for ride requests.",
  },
  total_cancelled_rides: {
    name: "Total cancelled rides",
    description: "These are only the cancelled trips made for ride requests.",
  },
  total_successful_immediate_rides: {
    name: "Total successful immediate rides",
    description:
      "These totals only include the successful immediate trips made for ride requests.",
  },
  total_successful_scheduled_rides: {
    name: "Total successful scheduled rides",
    description:
      "These totals only include the successful scheduled trips made for ride requests.",
  },
  total_cancelled_immediate_rides: {
    name: "Total cancelled immediate rides",
    description:
      "These totals only include the cancelled immediate trips made for ride requests.",
  },
  total_cancelled_scheduled_rides: {
    name: "Total cancelled scheduled rides",
    description:
      "These totals only include the cancelled scheduled trips made for ride requests.",
  },
  total_successful_connectme_rides: {
    name: "Total successful ConnectMe rides",
    description:
      "These totals only include the successful ConnectMe trips made for ride requests.",
  },
  total_cancelled_connectme_rides: {
    name: "Total cancelled ConnectMe rides",
    description:
      "These totals only include the cancelled ConnectMe trips made for ride requests.",
  },
  total_successful_connectus_rides: {
    name: "Total successful ConnectUs rides",
    description:
      "These totals only include the successful ConnectUs trips made for ride requests.",
  },
  total_cancelled_connectus_rides: {
    name: "Total cancelled ConnectUs rides",
    description:
      "These totals only include the cancelled ConnectUs trips made for ride requests.",
  },
  total_successful_cash_rides: {
    name: "Total successful cash rides",
    description:
      "These totals consider only the successful trips made for ride requests using cash payment medthod.",
  },
  total_cancelled_cash_rides: {
    name: "Total cancelled cash rides",
    description:
      "These totals consider only the cancelled trips made for ride requests using cash payment medthod.",
  },
  total_successful_wallet_rides: {
    name: "Total successful wallet rides",
    description:
      "These totals consider only the successful trips made for ride requests using wallet payment medthod.",
  },
  total_cancelled_wallet_rides: {
    name: "Total cancelled wallet rides",
    description:
      "These totals consider only the cancelled trips made for ride requests using wallet payment medthod.",
  },
  total_successful_deliveries: {
    name: "Total successful deliveries",
    description:
      "These are only the successful trips made for delivery requests.",
  },
  total_cancelled_deliveries: {
    name: "Total cancelled deliveries",
    description:
      "These are only the cancelled trips made for delivery requests.",
  },
  total_successful_immediate_deliveries: {
    name: "Total successful immediate deliveries",
    description:
      "These totals only include the successful immediate trips made for delivery requests.",
  },
  total_successful_scheduled_deliveries: {
    name: "Total successful scheduled deliveries",
    description:
      "These totals only include the successful scheduled trips made for delivery requests.",
  },
  total_cancelled_immediate_deliveries: {
    name: "Total cancelled immediate deliveries",
    description:
      "These totals only include the cancelled immediate trips made for delivery requests.",
  },
  total_cancelled_scheduled_deliveries: {
    name: "Total cancelled scheduled deliveries",
    description:
      "These totals only include the cancelled scheduled trips made for delivery requests.",
  },
  total_successful_cash_deliveries: {
    name: "Total successful cash deliveries",
    description:
      "These totals consider only the successful trips made for delivery requests using cash payment medthod.",
  },
  total_cancelled_cash_deliveries: {
    name: "Total cancelled cash deliveries",
    description:
      "These totals consider only the cancelled trips made for delivery requests using cash payment medthod.",
  },
  total_successful_wallet_deliveries: {
    name: "Total successful wallet deliveries",
    description:
      "These totals consider only the successful trips made for delivery requests using wallet payment medthod.",
  },
  total_cancelled_wallet_deliveries: {
    name: "Total cancelled wallet deliveries",
    description:
      "These totals consider only the cancelled trips made for delivery requests using wallet payment medthod.",
  },
  percentage_trip_handling: {
    name: "Percentage trip handling",
    description:
      "The percentage of the total trips (rides and deliveries) that got successfully handled by the drivers.",
  },
  percentage_rides_handling: {
    name: "Percentage rides handling",
    description:
      "The percentage of the total trips (rides) that got successfully handled by the drivers.",
  },
  percentage_deliveries_handling: {
    name: "Percentage deliveries handling",
    description:
      "The percentage of the total trips (deliveries) that got successfully handled by the couriers.",
  },
  total_riders: {
    name: "Total rides",
    description:
      "These are the periodical total number of riders registered on the platform.",
  },
  total_drivers: {
    name: "Total drivers",
    description:
      "These are the periodical total number of drivers registered on the platform.",
  },
  riders_to_drivers_ratio: {
    name: "Riders to drivers ratio",
    description:
      "This is the ratio of the total registered riders against the total registered drivers.",
  },
  total_commission: {
    name: "Total commission",
    description:
      "This is the sum of the total commission collected and the total commission pending.",
  },
  total_commission_collected: {
    name: "Total commission collected",
    description: "This is the total commission collected from day 1.",
  },
  total_commission_pending: {
    name: "Total commission pending",
    description:
      "This is the current outstanding commission to be paid by the drivers.",
  },
};

//...

const dataFrames = {
  daily_view: {
    name: "Daily",
    description: "Data for individual days grouped per week, month and year.",
  },
  weekly_view: {
    name: "Weekly",
    description: "Data for individual weeks group per month and year.",
  },
  yearly_view: {
    name: "Yearly",
    description: "Data for individual years.",
  },
  drivers_view: {
    name: "Drivers",
    description: "Data for individual drivers.",
  },
  riders_view: {
    name: "Riders",
    description: "Data for individual riders.",
  },
  busiest_pickup_suburbs: {
    name: "Busiest pickup locations",
    description:
      "These show the pickup location data ordered from the busiest.",
  },
  busiest_destination_suburbs: {
    name: "Busiest destination locations",
    description:
      "These show the destination location data ordered from the busiest.",
  },
};

class Visualize extends Component {
  constructor(props) {
    super(props);

    this.state = {
      optionsForTargetData: [],
      optionsForDataframe: [],
      //...
      year_selected: 2021,
      dataframe: "",
      week_selected: 1,
      targetData: "",
    };
  }

  componentWillMount() {
    //1. Form the option data
    let optionTarget = [];
    for (var el in descriptionsDataFrames) {
      let optionTemplate = {
        value: el,
        label: (
          <div>
            <div className={classes.headDataframeInfo}>
              {descriptionsDataFrames[el].name}
            </div>
            <div className={classes.headDatafdescr}>
              {descriptionsDataFrames[el].description}
            </div>
          </div>
        ),
      };
      //...Save
      optionTarget.push(optionTemplate);
    }
    //...
    this.state.optionsForTargetData = optionTarget;

    //2. Form the option data
    let optionDataframe = [];
    for (var el in dataFrames) {
      let optionTemplate = {
        value: el,
        label: (
          <div>
            <div className={classes.headDataframeInfo}>
              {dataFrames[el].name}
            </div>
            <div className={classes.headDatafdescr}>
              {dataFrames[el].description}
            </div>
          </div>
        ),
      };
      //...Save
      optionDataframe.push(optionTemplate);
    }
    //...
    this.state.optionsForDataframe = optionDataframe;
  }

  exploreData() {
    if (this.state.dataframe !== "" && this.state.targetData !== "") {
      console.log(this.state.year_selected);
      console.log(this.state.dataframe);
      console.log(this.state.week_selected);
      console.log(this.state.targetData);
      let dataBundle = {
        year_selected: this.state.year_selected,
        dataframe: this.state.dataframe,
        week_selected: this.state.week_selected,
        targetData: this.state.targetData,
      };
      //...
      this.props.UpdateStatisticalBundleData(dataBundle);
      window.location.href = "/visualizer";
    } else {
      alert(
        "Please make sure the Dataframe and the Target data are properly selected."
      );
    }
  }

  render() {
    return (
      <div
        style={{
          padding: "10px",
          marginTop: "10px",
          overflowX: "hidden",
          // border: "1px solid red",
          minHeight: "90vh",
        }}
      >
        {" "}
        <div className={classes.headerGeneric}>
          <div>
            <div>Statistics</div>
          </div>
        </div>
        {/* Data sculpter */}
        <div>
          <div className={classes.infoSpecifyerNode}>
            <div
              className={classes.labelGraphSettings}
              style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
            >
              Period
            </div>
            <select
              className={classes.selectGenericBasic}
              onChange={(val) => {
                this.setState({ year_selected: val.target.value });
              }}
              disabled={
                /(daily_view|monthly_view|weekly_view)/i.test(
                  this.state.dataframe
                )
                  ? false
                  : true
              }
              style={{
                backgroundColor: /(daily_view|monthly_view|weekly_view)/i.test(
                  this.state.dataframe
                )
                  ? "#fff"
                  : "#d0d0d0",
              }}
            >
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
            {/* description */}
            <div className={classes.labelGraphSettings}>
              Specify the year for which you want to retrieve the data.
            </div>
          </div>
        </div>
        {/* Dataframe */}
        <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
          <div
            className={classes.infoSpecifyerNode}
            style={{ maxWidth: "70%" }}
          >
            <div
              className={classes.labelGraphSettings}
              style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
            >
              Dataframe
            </div>
            <Select
              options={this.state.optionsForDataframe}
              defaultValue={this.state.dataframe}
              onChange={(val) => {
                this.setState({ dataframe: val.value });
              }}
            />
            {/* description */}
            <div
              className={classes.labelGraphSettings}
              style={{ marginTop: "15px" }}
            >
              Specify the general set of data from which you want to get the
              targeted data.
            </div>
          </div>
          {/* Week number */}
          {/* <div
            className={classes.infoSpecifyerNode}
            style={{ marginLeft: "7%" }}
          >
            <div
              className={classes.labelGraphSettings}
              style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
            >
              Week
            </div>
            <select
              className={classes.selectGenericBasic}
              onChange={(val) => {
                this.setState({ week_selected: val.target.value });
              }}
              disabled={
                this.state.dataframe === "weekly_view" &&
                this.state.dataframe.length > 0
                  ? false
                  : true
              }
              style={{
                backgroundColor:
                  this.state.dataframe === "weekly_view" &&
                  this.state.dataframe.length > 0
                    ? "#fff"
                    : "#d0d0d0",
              }}
            >
              {new Array(53).fill(1).map((_, index) => {
                return <option value={index + 1}>{index + 1}</option>;
              })}
            </select>
            { description }
            <div className={classes.labelGraphSettings}>
              Specify the year for which you want to retrieve the data.
            </div>
          </div> */}
        </div>
        {/* Target data */}
        <div>
          <div
            className={classes.infoSpecifyerNode}
            style={{ maxWidth: "70%" }}
          >
            <div
              className={classes.labelGraphSettings}
              style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
            >
              Target data
            </div>
            <Select
              options={this.state.optionsForTargetData}
              defaultValue={this.state.targetData}
              onChange={(val) => {
                this.setState({ targetData: val.value });
              }}
            />
            {/* description */}
            <div
              className={classes.labelGraphSettings}
              style={{ marginTop: "15px" }}
            >
              Specify data of interest that you wish to explore.
            </div>
          </div>
        </div>
        {/* Submit */}
        <div className={classes.exploreDataZone}>
          <div className={classes.privacyZone}>
            Any use of the data retrieved from this too without proper
            authorizations will results in legal actions.
          </div>
          <div
            className={classes.genericButton}
            onClick={() => this.exploreData()}
          >
            Explore data
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { App } = state;
  return { App };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      UpdateStatisticalBundleData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Visualize);
