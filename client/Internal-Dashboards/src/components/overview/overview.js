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

const greenData = [
  { x: "Mon", y: 10, sorter: 12 },
  { x: "Tues", y: 5 },
  { x: "Wed", y: 15 },
];

const blueData = [
  { x: "Thu", y: 12 },
  { x: "Fri", y: 2 },
  { x: "Sat", y: 11 },
];

class Overview extends React.PureComponent {
  constructor(props) {
    super(props);

    this.intervalPersister = null;

    this.state = {
      useCanvas: false,
      crosshairValues: [],
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
      this.props.App.overviewData !== null &&
      this.props.App.overviewData !== undefined &&
      this.props.App.overviewData.response !== undefined &&
      this.props.App.overviewData.response.daily_view !== undefined
        ? this.props.App.overviewData.response.daily_view.total_trips
        : [],
      this.props.App.overviewData !== null &&
      this.props.App.overviewData !== undefined &&
      this.props.App.overviewData.response !== undefined &&
      this.props.App.overviewData.response.daily_view !== undefined
        ? this.props.App.overviewData.response.daily_view.total_successful_trips
        : [],
    ];
    //....
    this.setState({ crosshairValues: DATA.map((d) => d[index]) });
  };

  componentDidMount() {
    let globalObject = this;

    this.props.App.SOCKET_CORE =
      this.props.App.SOCKET_CORE.on === undefined ||
      this.props.App.SOCKET_CORE.on === null
        ? SOCKET_CORE
        : this.props.App.SOCKET_CORE;

    this.getOverviewDataStats();

    //Handle socket events
    this.props.App.SOCKET_CORE.on(
      "getMastiff_insightData-response",
      function (response) {
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          /error/i.test(response.response) === false &&
          /error/i.test(response) === false
        ) {
          globalObject.props.UpdateOverviewData(response);
        }
      }
    );

    //2. For global day 1 data
    this.props.App.SOCKET_CORE.on(
      "getMastiff_insightData-parallel-response",
      function (response) {
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          /error/i.test(response.response) === false &&
          /error/i.test(response) === false
        ) {
          globalObject.props.UpdateGlobalOverviewData(response);
        }
      }
    );
  }

  /**
   *  Responsible for getting periodically the overview data
   */
  getOverviewDataStats() {
    let globalObject = this;

    if (this.props.App.loginData.admin_data !== null) {
      try {
        globalObject.props.App.SOCKET_CORE.emit("getMastiff_insightData", {
          isolation_factor: "generic_view|daily_view",
          day_zoom: 30,
          make_graphReady: true,
        });
        //!Parallel for global overview
        globalObject.props.App.SOCKET_CORE.emit("getMastiff_insightData", {
          isolation_factor: "generic_view|daily_view",
          day_zoom: 300000,
          parallel: true,
        });
        //...
        this.intervalPersister = setInterval(function () {
          globalObject.props.App.SOCKET_CORE.emit("getMastiff_insightData", {
            isolation_factor: "generic_view|daily_view",
            day_zoom: 30,
            make_graphReady: true,
          });
          //!Parallel for global overview
          globalObject.props.App.SOCKET_CORE.emit("getMastiff_insightData", {
            isolation_factor: "generic_view|daily_view",
            day_zoom: 300000,
            parallel: true,
          });
        }, 25000);
      } catch (error) {
        clearInterval(this.intervalPersister);
      }
    } //Clear
    else {
      clearInterval(this.intervalPersister);
    }
  }

  /**
   * Responsible for returning a valid value or zero if the value does not exist
   * For the generic data
   */
  returnValidValueOrZero(value) {
    try {
      return this.props.App.globalOverviewData.response.genericGlobalStats[
        value
      ];
    } catch (error) {
      return 0;
    }
  }

  render() {
    console.log(
      this.props.App.overviewData !== null &&
        this.props.App.overviewData !== undefined &&
        this.props.App.overviewData.response !== undefined &&
        this.props.App.overviewData.response.daily_view !== undefined
        ? this.props.App.overviewData.response
        : []
    );
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
            For the last 30 days
          </div>
        </div>
        <div className={classes.chartContainer}>
          <FlexibleXYPlot xType="ordinal" height={400} stackBy="y">
            <VerticalGridLines />
            <HorizontalGridLines />
            <XAxis title="Days" />
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
                this.props.App.overviewData !== null &&
                this.props.App.overviewData !== undefined &&
                this.props.App.overviewData.response !== undefined &&
                this.props.App.overviewData.response.daily_view !== undefined
                  ? this.props.App.overviewData.response.daily_view
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
            />

            {/* Show cancelled total trips */}
            <VerticalBarSeries
              data={
                this.props.App.overviewData !== null &&
                this.props.App.overviewData !== undefined &&
                this.props.App.overviewData.response !== undefined &&
                this.props.App.overviewData.response.daily_view !== undefined
                  ? this.props.App.overviewData.response.daily_view
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
            />

            {/* Crosshair */}
            <Crosshair
              values={this.state.crosshairValues}
              className={"test-class-name"}
              titleFormat={(d) => ({ title: "Trips", value: d[0].y + d[1].y })}
              itemsFormat={(d) => [
                { title: "Successful", value: d[0].y },
                { title: "Cancelled", value: d[1].y },
              ]}
            />
          </FlexibleXYPlot>
        </div>
        <div className={classes.globalNumbersContainer}>
          <div className={classes.headerGBNumbers}>Global numbers</div>

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
                value: `${parseFloat(
                  (100 *
                    parseInt(
                      this.returnValidValueOrZero("total_successful_trips")
                    )) /
                    parseInt(
                      this.returnValidValueOrZero("total_cancelled_trips")
                    )
                ).toFixed(2)}%`,
              },
              {
                title: "Riders to drivers ratio",
                value: "-",
              },
            ]}
          />

          <NodeTableExplainer
            marginTop={50}
            title="Sales related (N$)"
            left={[]}
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
