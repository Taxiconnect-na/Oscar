import React, { Component } from "react";
import classes from "./Visualize.module.css";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateStatisticalBundleData } from "../../Redux/HomeActionsCreators";
import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  LineSeries,
  AreaSeries,
  LabelSeries,
  HeatmapSeries,
  makeWidthFlexible,
  DiscreteColorLegend,
  Crosshair,
} from "react-vis";
import "react-vis/dist/style.css";
import SOCKET_CORE from "../socket";
import { MdInfo, MdDescription, MdReportProblem } from "react-icons/md";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import DateRangePicker from "@wojtekmaj/react-daterange-picker/dist/entry.nostyle";
import "./Calendar.css";
import "./DateRangePicker.css";
import Loader from "react-loader-spinner";

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

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

class Visualizer extends Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      contentData: {},
      filteredData: [], //Will contain all the targeted data only!
      isLoading: true, //To indicate the loading state
      isSmallLoading: true,
      year_selected: 2022, //The selected year
      rangeDate_selected: {
        startDate: new Date(),
        endDate: new Date(),
      },
      rangeDate_static: {
        startDate: new Date(),
        endDate: new Date(),
      },
      graphType: VerticalBarSeries, //The graph type - bar, line, ...
      crosshairValues: [],
    };
  }

  componentDidMount() {
    let that = this;

    this.getContentData();

    //HANDLE SOCKET EVENTS
    this.SOCKET_CORE.on("getMastiff_insightData-response", function (response) {
      that.setState({ isSmallLoading: false });
      if (
        response !== undefined &&
        response !== null &&
        response.response !== undefined &&
        response.response !== null &&
        /error/i.test(response.response) === false &&
        /error/i.test(response) === false
      ) {
        // console.log(response);
        if (
          that.state.contentData === null ||
          that.state.contentData.stateHash !== response.stateHash
        ) {
          //! Filter based on the date range
          let filteredData =
            response.response[that.props.App.statisticsBundleData.dataframe][
              that.props.App.statisticsBundleData.targetData
            ];

          if (
            /(daily|weekly|busiest_pickup_suburbs|busiest_destination_suburbs|drivers_view|riders_view)/i.test(
              that.props.App.statisticsBundleData.dataframe
            )
          ) {
            //? Deduct the min and max date for the range
            let minDateStatic = new Date(filteredData[0].sorter);
            let maxDateStatic = new Date(
              filteredData[filteredData.length - 1].sorter
            );
            //? Default select the time range - last 15 days
            let minDateSelected = new Date(
              filteredData[filteredData.length - 15].sorter
            );
            let maxDateSelected = new Date(
              filteredData[filteredData.length - 1].sorter
            );
            //...
            that.setState({
              contentData: response,
              filteredData: filteredData,
              rangeDate_static: {
                startDate: minDateStatic,
                endDate: maxDateStatic,
              },
              rangeDate_selected: {
                startDate: minDateSelected,
                endDate: maxDateSelected,
              },
              isLoading: false,
              isSmallLoading: false,
            });
          } else if (
            /yearly/i.test(that.props.App.statisticsBundleData.dataframe)
          ) {
            //? Deduct the min and max date for the range
            let minDateStatic = new Date();
            let maxDateStatic = new Date();
            //? Default select the time range - last 15 days
            let minDateSelected = new Date();
            let maxDateSelected = new Date();
            //...
            that.setState({
              contentData: response,
              filteredData: filteredData,
              rangeDate_static: {
                startDate: minDateStatic,
                endDate: maxDateStatic,
              },
              rangeDate_selected: {
                startDate: minDateSelected,
                endDate: maxDateSelected,
              },
              isLoading: false,
              isSmallLoading: false,
            });
          }
        }
      }
    });
  }

  componentWillUnmount() {
    clearInterval(this.intervalPersister);
  }

  getContentData() {
    let that = this;

    if (this.state.isLoading === true) {
      this.SOCKET_CORE.emit("getMastiff_insightData", {
        isolation_factor: this.props.App.statisticsBundleData.dataframe,
        day_zoom: 300000,
        targetData: this.props.App.statisticsBundleData.targetData,
        make_graphReady: true,
      });
    }

    this.intervalPersister = setInterval(function () {
      that.setState({
        isSmallLoading: that.state.isLoading === false ? true : false,
      });
      that.SOCKET_CORE.emit("getMastiff_insightData", {
        isolation_factor: that.props.App.statisticsBundleData.dataframe,
        day_zoom: 300000,
        targetData: that.props.App.statisticsBundleData.targetData,
        make_graphReady: true,
      });
    }, 25000);
  }

  getFilteredDataForGraph() {
    let that = this;

    if (
      /(daily|weekly|busiest_pickup_suburbs|busiest_destination_suburbs|drivers_view|riders_view)/i.test(
        that.props.App.statisticsBundleData.dataframe
      )
    ) {
      //! Filter based on the date range
      let tempDistilledData = this.state.filteredData.filter((el) => {
        //Only consider the date range - SELECTED
        if (
          new Date(el.sorter) >= that.state.rangeDate_selected.startDate &&
          new Date(el.sorter) <= that.state.rangeDate_selected.endDate
        ) {
          return el;
        }
      });
      //! DEBUG
      this.forecastingEngine();
      //...
      return tempDistilledData !== undefined && tempDistilledData !== null
        ? tempDistilledData
        : [];
    } else if (/yearly/i.test(that.props.App.statisticsBundleData.dataframe)) {
      let tempDistilledData = this.state.filteredData;
      //! DEBUG
      this.forecastingEngine();
      //...
      return tempDistilledData !== undefined && tempDistilledData !== null
        ? tempDistilledData
        : [];
    }
  }

  updateGraphType(graph) {
    if (graph === "line") {
      this.setState({ graphType: LineSeries });
    } else if (graph === "area") {
      this.setState({ graphType: AreaSeries });
    } else if (graph === "heatmap") {
      this.setState({ graphType: HeatmapSeries });
    }
    //Bar series
    else {
      this.setState({ graphType: VerticalBarSeries });
    }
  }

  forecastingEngine() {
    // console.log("Forecasting engine called.");
    let dataframe = this.props.App.statisticsBundleData.dataframe;

    if (/daily/i.test(dataframe)) {
      //Daily
      //Order the data
      let inputRawData = this.state.filteredData;
      // console.log(inputRawData);
      //? Consider the last 7 days to forecast the next 7 days
      let daysSpanData = { current_year: [], previous_year: [] };
      let daysLimit = [
        inputRawData.length - 1 - 7,
        inputRawData.length - 1 - 1,
      ]; //? Do not take the current day

      //Get for this year
      inputRawData.map((el, index) => {
        if (index >= daysLimit[0] && index <= daysLimit[1]) {
          daysSpanData.current_year.push(el);
          //Extract the year
          let tmpCurrentYear = parseInt(el.x.split("/")[2]);
          //Get the same data for the previous year as well
          let keyPrediction = `${el.x.split("/")[0]}/${el.x.split("/")[1]}/${
            tmpCurrentYear - 1
          }`;
          // console.log(keyPrediction);
          let sameLastYearRecord = inputRawData.filter((prevRecord) => {
            if (prevRecord.x === keyPrediction) {
              return prevRecord;
            }
          })[0];
          //Save
          daysSpanData.previous_year.push(
            sameLastYearRecord !== undefined && sameLastYearRecord !== null
              ? sameLastYearRecord
              : undefined
          );
        }
      });

      // console.log(daysSpanData);
    } //No valid dataframe provided
    else {
      return [];
    }
  }

  /**
   * Event handler for onMouseLeave.
   * @private
   */
  _onMouseLeave = () => {
    this.setState({ crosshairValues: [] });
  };

  /**
   * Event handler for onNearestX.
   * @param {Object} value Selected value.
   * @param {index} index Index of the value in the data array.
   * @private
   */
  _onNearestX = (value, { index }) => {
    let DATA = [this.getFilteredDataForGraph(), []];
    //....
    this.setState({ crosshairValues: DATA.map((d) => d[index]) });
  };

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
            <div>
              {
                descriptionsDataFrames[
                  this.props.App.statisticsBundleData.targetData
                ].name
              }{" "}
              data
            </div>
            <div className={classes.subHeaderTitle}>
              {dataFrames[this.props.App.statisticsBundleData.dataframe].name}{" "}
              data {/* Show the date span */}
              {/yearly/i.test(this.props.App.statisticsBundleData.dataframe) ===
              false ? (
                <span className={classes.dateTitleRange}>
                  from{" "}
                  {this.state.rangeDate_selected.startDate.toLocaleDateString()}
                  -{this.state.rangeDate_selected.endDate.toLocaleDateString()}
                </span>
              ) : (
                <></>
              )}
            </div>
          </div>

          {/*  */}
          <div className={classes.switchView}>
            {this.state.isSmallLoading && this.state.isLoading === false ? (
              <div style={{ marginLeft: 20 }}>
                <Loader
                  type="TailSpin"
                  color="#000"
                  height={18}
                  width={18}
                  timeout={300000000} //3 secs
                />
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        {/* Graph */}
        <div className={classes.chartContainer}>
          {this.state.isLoading === false &&
          this.getFilteredDataForGraph().length > 0 ? (
            <FlexibleXYPlot
              xType="ordinal"
              margin={{
                bottom: 100,
              }}
              height={420}
              stackBy="y"
            >
              <VerticalGridLines />
              <HorizontalGridLines />
              <XAxis
                tickLabelAngle={90}
                tickFormat={(v) =>
                  v !== "null"
                    ? String(v).length > 10
                      ? `${String(v).substr(0, 8)}...`
                      : v
                    : "Not found"
                }
                tickPadding={60}
                position={"middle"}
              />
              <YAxis tickFormat={(v) => (/\./i.test(String(v)) ? null : v)} />
              <DiscreteColorLegend
                style={{ position: "relative", left: "20px", bottom: "0px" }}
                orientation="horizontal"
                items={[
                  {
                    title: /earnings/i.test(this.state.typeSelected)
                      ? "Earnings"
                      : "Requests",
                    color: /earnings/i.test(this.state.typeSelected)
                      ? "#09864A"
                      : "#235789",
                  },
                ]}
              />

              <this.state.graphType
                data={
                  this.state.filteredData !== undefined &&
                  this.state.filteredData !== null &&
                  this.getFilteredDataForGraph().length > 0
                    ? this.getFilteredDataForGraph()
                    : []
                }
                curve={"curveMonotoneX"}
                style={{
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                }}
                color={
                  /earnings/i.test(this.state.typeSelected)
                    ? "#09864A"
                    : "#235789"
                }
                onNearestX={this._onNearestX}
                onValueMouseOut={this._onMouseLeave}
              />

              {/* Crosshair */}
              <Crosshair
                values={this.state.crosshairValues}
                className={"test-class-name"}
                titleFormat={(d) => ({
                  title: "Total",
                  value: /sales/i.test(this.state.typeSelected)
                    ? `N$${d[0].y}`
                    : d[0].y,
                })}
                itemsFormat={(d) => [
                  {
                    title:
                      /(busiest_pickup_suburbs|busiest_destination_suburbs)/i.test(
                        this.props.App.statisticsBundleData.dataframe
                      ) === false
                        ? this.props.App.statisticsBundleData.dataframe.replace(
                            "ly_view",
                            ""
                          )
                        : /(drivers|riders)/i.test(
                            this.props.App.statisticsBundleData.dataframe
                          )
                        ? "User"
                        : "Location",
                    value:
                      d[0].x !== null && d[0].x !== "null"
                        ? String(d[0].x).length > 10
                          ? `${String(d[0].x).substr(0, 8)}...`
                          : d[0].x
                        : "Not found",
                  },
                ]}
              />
            </FlexibleXYPlot>
          ) : this.state.isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <Loader
                type="TailSpin"
                color="#000"
                height={40}
                width={40}
                timeout={300000000} //3 secs
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              No data to show
            </div>
          )}
        </div>
        {/* Options */}
        {this.state.isLoading === false ? (
          <div className={classes.optionsBar}>
            <div className={classes.infoSpecifyerNode}>
              <div
                className={classes.labelGraphSettings}
                style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
              >
                Graph
              </div>
              <select
                className={classes.selectGenericBasic}
                onChange={(val) => {
                  this.updateGraphType(val.target.value);
                }}
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </div>

            {/* Month range */}
            {/yearly/i.test(this.props.App.statisticsBundleData.dataframe) ===
            false ? (
              <div className={classes.infoSpecifyerNode}>
                <div
                  className={classes.labelGraphSettings}
                  style={{ fontFamily: "MoveTextMedium", color: "#096ED4" }}
                >
                  Date range
                </div>
                <div className={classes.dateRangeSelector}>
                  <DateRangePicker
                    onChange={(val) => {
                      let newRange = {
                        startDate: val[0],
                        endDate: val[1],
                      };
                      //...
                      this.setState({ rangeDate_selected: newRange });
                    }}
                    minDate={this.state.rangeDate_static.startDate}
                    maxDate={this.state.rangeDate_static.endDate}
                    value={[
                      this.state.rangeDate_selected.startDate,
                      this.state.rangeDate_selected.endDate,
                    ]}
                  />
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <></>
        )}
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

export default connect(mapStateToProps, mapDispatchToProps)(Visualizer);
