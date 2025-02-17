import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  UpdateSuccessfullLoginDetails,
  UpdateOverviewData,
  UpdateGlobalOverviewData,
} from "../../Redux/HomeActionsCreators";

import SOCKET_CORE from "../socket";

import classes from "./overview.module.css";
import LogoGeneric from "../../Assets/logotaxiconnect.png";
import {
  AiOutlineSecurityScan,
  AiTwotoneCalendar,
  AiTwotoneCloseSquare,
} from "react-icons/ai";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";

import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  LineSeries,
  LabelSeries,
  makeWidthFlexible,
  DiscreteColorLegend,
  Crosshair,
} from "react-vis";
import "react-vis/dist/style.css";
import NodeTableExplainer from "../../Helpers/NodeTableExplainer";

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

class Overview extends React.PureComponent {
  constructor(props) {
    super(props);

    this.intervalPersister = null;

    this.SOCKET_CORE = SOCKET_CORE;

    this.state = {
      useCanvas: false,
      crosshairValues: [],
      day_zoom: 7,
      globalOverviewData: null,
      overviewData: null,
      isLoading: true,
    };
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
    let DATA = [
      this.state.overviewData !== null &&
      this.state.overviewData !== undefined &&
      this.state.overviewData.response !== undefined &&
      this.state.overviewData.response.daily_view !== undefined
        ? this.state.overviewData.response.daily_view.total_trips
        : [],
      this.state.overviewData !== null &&
      this.state.overviewData !== undefined &&
      this.state.overviewData.response !== undefined &&
      this.state.overviewData.response.daily_view !== undefined
        ? this.state.overviewData.response.daily_view.total_successful_trips
        : [],
    ];
    //....
    this.setState({ crosshairValues: DATA.map((d) => d[index]) });
  };

  componentDidMount() {
    let that = this;

    this.getOverviewDataStats();

    //Handle socket events
    this.SOCKET_CORE.on("getMastiff_insightData-response", function (response) {
      if (
        response !== undefined &&
        response !== null &&
        response.response !== undefined &&
        response.response !== null &&
        /error/i.test(response.response) === false &&
        /error/i.test(response) === false
      ) {
        if (
          that.state.overviewData === null ||
          that.state.overviewData.stateHash !== response.stateHash
        ) {
          console.error("Graph data");
          console.log(response);
          that.setState({ overviewData: response, isLoading: false });
        }
      }
    });

    //2. For global day 1 data
    this.SOCKET_CORE.on(
      "getMastiff_insightData-parallel-response",
      function (response) {
        // console.log(response);
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          /error/i.test(response.response) === false &&
          /error/i.test(response) === false
        ) {
          if (
            that.state.globalOverviewData === null ||
            that.state.globalOverviewData.stateHash !== response.stateHash
          ) {
            console.log(response);
            that.setState({ globalOverviewData: response });
          }
        }
      }
    );
  }

  /**
   *  Responsible for getting periodically the overview data
   */
  getOverviewDataStats() {
    let that = this;

    if (this.props.App.loginData.admin_data !== null) {
      try {
        that.SOCKET_CORE.emit("getMastiff_insightData", {
          isolation_factor: "generic_view|daily_view",
          day_zoom:
            this.state.day_zoom === null || this.state.day_zoom === undefined
              ? 0
              : this.state.day_zoom,
          make_graphReady: true,
        });
        //!Parallel for global overview
        that.SOCKET_CORE.emit("getMastiff_insightData", {
          isolation_factor: "generic_view|daily_view",
          day_zoom: 300000,
          parallel: true,
        });
        //...
        this.intervalPersister = setInterval(function () {
          that.SOCKET_CORE.emit("getMastiff_insightData", {
            isolation_factor: "generic_view|daily_view",
            day_zoom:
              that.state.day_zoom === null || that.state.day_zoom === undefined
                ? 0
                : that.state.day_zoom,
            make_graphReady: true,
          });
          console.log("Clock on updated");
          //!Parallel for global overview
          that.SOCKET_CORE.emit("getMastiff_insightData", {
            isolation_factor: "generic_view|daily_view",
            day_zoom: 300000,
            parallel: true,
          });
        }, 10000);
      } catch (error) {
        clearInterval(this.intervalPersister);
      }
    } //Clear
    else {
      clearInterval(this.intervalPersister);
    }
  }

  componentWillUnmount() {
    clearInterval(this.intervalPersister);
  }

  /**
   * Responsible for returning a valid value or zero if the value does not exist
   * For the generic data
   */
  returnValidValueOrZero(value) {
    try {
      return this.state.globalOverviewData.response.genericGlobalStats[value];
    } catch (error) {
      return 0;
    }
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
        <div className={classes.headerGeneric}>
          <div>Operations summary</div>
          <div className={classes.dayZoomLabel}>
            <AiTwotoneCalendar
              style={{ marginRight: 5, bottom: 1, position: "relative" }}
            />
            For the last (days)
            <input
              type="number"
              placeholder="Time frame"
              value={
                this.state.day_zoom === null ||
                this.state.day_zoom === undefined
                  ? ""
                  : this.state.day_zoom
              }
              style={{
                width: "100px",
                textAlign: "center",
                marginLeft: "10px",
              }}
              onChange={(val) => {
                let newVal = parseInt(val.target.value);
                console.log(newVal);
                if (newVal <= 1825) {
                  this.setState({
                    day_zoom: newVal,
                    isLoading: true,
                    overviewData: null,
                  });
                } else if (isNaN(newVal)) {
                  this.setState({
                    day_zoom: null,
                    isLoading: true,
                    overviewData: null,
                  });
                }
                //Defaults to 7 days
                else {
                  this.setState({
                    day_zoom: 7,
                    isLoading: true,
                    overviewData: null,
                  });
                }
              }}
            />
          </div>
        </div>
        <div className={classes.chartContainer}>
          {this.state.isLoading ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
          ) : Object.keys(this.state.overviewData.response.daily_view).length <=
            0 ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No data to show
            </div>
          ) : (
            <FlexibleXYPlot
              xType="ordinal"
              height={400}
              margin={{ bottom: 100 }}
              stackBy="y"
            >
              <VerticalGridLines />
              <HorizontalGridLines />
              <XAxis title="Days" tickLabelAngle={90} tickPadding={60} />
              <YAxis tickFormat={(v) => (/\./i.test(String(v)) ? null : v)} />
              <DiscreteColorLegend
                style={{ position: "relative", left: "20px", bottom: "0px" }}
                orientation="horizontal"
                items={[
                  {
                    title: "Successful trips",
                    color: "#3EA37C",
                  },
                  {
                    title: "Cancelled trips",
                    color: "#a13d63",
                  },
                ]}
              />

              <VerticalBarSeries
                data={
                  this.state.overviewData !== null &&
                  this.state.overviewData !== undefined &&
                  this.state.overviewData.response !== undefined &&
                  this.state.overviewData.response.daily_view !== undefined
                    ? this.state.overviewData.response.daily_view
                        .total_successful_trips
                    : []
                }
                curve={"curveMonotoneX"}
                style={{
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                }}
                color={"#3EA37C"}
                onNearestX={this._onNearestX}
                onValueMouseOut={this._onMouseLeave}
              />

              {/* Show cancelled total trips */}
              <VerticalBarSeries
                data={
                  this.state.overviewData !== null &&
                  this.state.overviewData !== undefined &&
                  this.state.overviewData.response !== undefined &&
                  this.state.overviewData.response.daily_view !== undefined
                    ? this.state.overviewData.response.daily_view
                        .total_cancelled_trips
                    : []
                }
                curve={"curveMonotoneX"}
                style={{
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                }}
                color={"#a13d63"}
                onNearestX={this._onNearestX}
                onValueMouseOut={this._onMouseLeave}
              />

              {/* Crosshair */}
              <Crosshair
                values={this.state.crosshairValues}
                className={"test-class-name"}
                titleFormat={(d) => ({
                  title: "Trips",
                  value: d[0].y + d[1].y,
                })}
                itemsFormat={(d) => [
                  { title: "Successful", value: d[1].y },
                  { title: "Cancelled", value: d[0].y },
                ]}
              />
            </FlexibleXYPlot>
          )}
        </div>
        <div className={classes.globalNumbersContainer}>
          <div className={classes.headerGBNumbers}>
            Global numbers{" "}
            <span style={{ fontSize: "12px", color: "#096ED4" }}>
              - From day 1
            </span>
          </div>

          <NodeTableExplainer
            title="Trips related"
            left={[
              {
                title: "Total trips",
                value: this.returnValidValueOrZero("total_trips"),
              },
              {
                title: "Total successful trips",
                value: this.returnValidValueOrZero("total_successful_trips"),
              },
              {
                title: "Total cancelled trips",
                value: this.returnValidValueOrZero("total_cancelled_trips"),
              },
              {
                title: "Total successful rides",
                value: this.returnValidValueOrZero("total_successful_rides"),
              },
              {
                title: "Total cancelled rides",
                value: this.returnValidValueOrZero("total_cancelled_rides"),
              },
              {
                title: "Total successful deliveries",
                value: this.returnValidValueOrZero(
                  "total_successful_deliveries"
                ),
              },
              {
                title: "Total cancelled deliveries",
                value: this.returnValidValueOrZero(
                  "total_cancelled_deliveries"
                ),
              },
            ]}
            right={[
              {
                title: "Total ConnectMe trips",
                value: this.returnValidValueOrZero("total_connectme_trips"),
              },
              {
                title: "Total ConnectUs trips",
                value: this.returnValidValueOrZero("total_connectus_trips"),
              },
              {
                title: "Total immediate trips",
                value: this.returnValidValueOrZero("total_immediate_trips"),
              },
              {
                title: "Total scheduled trips",
                value: this.returnValidValueOrZero("total_scheduled_trips"),
              },
              {
                title: "Percentage trip handling",
                value:
                  parseInt(
                    this.returnValidValueOrZero("total_cancelled_trips")
                  ) !== 0
                    ? `${parseFloat(
                        (100 *
                          parseInt(
                            this.returnValidValueOrZero(
                              "total_successful_trips"
                            )
                          )) /
                          parseInt(
                            this.returnValidValueOrZero("total_cancelled_trips")
                          )
                      ).toFixed(2)}%`
                    : "0%",
              },
            ]}
          />
        </div>

        <div className={classes.globalNumbersContainer}>
          <NodeTableExplainer
            marginTop={50}
            title="Sales related (N$)"
            left={[
              {
                title: "Total cash trips",
                value: this.returnValidValueOrZero("total_cash_trips"),
              },
              {
                title: "Total wallet trips",
                value: this.returnValidValueOrZero("total_wallet_trips"),
              },
              {
                title: "Total cash trips sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_cash_trips_sales"
                )}`,
              },
              {
                title: "Total wallet trips sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_wallet_trips_sales"
                )}`,
              },
              {
                title: "Total successful cash rides sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_successful_cash_rides_sales"
                )}`,
              },
              {
                title: "Total cancelled cash rides sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_cancelled_cash_rides_sales"
                )}`,
              },
              {
                title: "Total successful wallet rides sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_successful_wallet_rides_sales"
                )}`,
              },
            ]}
            right={[
              {
                title: "Total cancelled wallet deliveries sales",
                value: `N$${this.returnValidValueOrZero(
                  "total_cancelled_wallet_rides_sales"
                )}`,
              },
              {
                title: "Total successful cash deliveries",
                value: this.returnValidValueOrZero(
                  "total_successful_cash_deliveries"
                ),
              },
              {
                title: "Total cancelled wallet deliveries",
                value: this.returnValidValueOrZero(
                  "total_cancelled_cash_deliveries"
                ),
              },
              {
                title: "Total successful wallet deliveries sales",
                value: this.returnValidValueOrZero(
                  "total_successful_wallet_deliveries_sales"
                ),
              },

              {
                title: "Total cancelled wallet deliveries sales",
                value: this.returnValidValueOrZero(
                  "total_cancelled_wallet_deliveries_sales"
                ),
              },
            ]}
          />
        </div>

        <div className={classes.globalNumbersContainer}>
          <NodeTableExplainer
            marginTop={50}
            title="Users related"
            left={[
              {
                title: "Total number of riders",
                value: this.returnValidValueOrZero("total_riders"),
              },
              {
                title: "Total number of drivers",
                value: this.returnValidValueOrZero("total_drivers"),
              },
              {
                title: "Riders who requested",
                value: this.returnValidValueOrZero(
                  "total_numberOf_passengers_requestedFor"
                ),
              },
              {
                title: "Riders successfully moved",
                value: this.returnValidValueOrZero(
                  "total_numberOf_passengers_successfully_moved"
                ),
              },
              {
                title: "Riders not moved after request",
                value: this.returnValidValueOrZero(
                  "total_numberOf_passengers_cancelled_moved"
                ),
              },
            ]}
            right={[
              {
                title: "Riders to drivers ratio",
                value: "-",
              },
            ]}
          />
        </div>

        <div className={classes.globalNumbersContainer}>
          <NodeTableExplainer
            marginTop={50}
            title="Commission related (N$)"
            left={[
              {
                title: "Total commission gathered",
                value: `N$${this.returnValidValueOrZero("total_commission")}`,
              },
              {
                title: "Total commission collected",
                value: `N$${this.returnValidValueOrZero(
                  "total_commission_collected"
                )}`,
              },
              {
                title: "Total commission pending",
                value: `N$${this.returnValidValueOrZero(
                  "total_commission_pending"
                )}`,
              },
            ]}
            right={[]}
          />
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
      UpdateSuccessfullLoginDetails,
      UpdateOverviewData,
      UpdateGlobalOverviewData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Overview);
