import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  UpdateSuccessfullLoginDetails,
  UpdateOverviewData,
} from "../../Redux/HomeActionsCreators";

import SOCKET_CORE from "../socket";

import classes from "./overview.module.css";
import LogoGeneric from "../../Assets/logotaxiconnect.png";
import { AiOutlineSecurityScan } from "react-icons/ai";
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
} from "react-vis";
import "react-vis/dist/style.css";

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

const greenData = [
  { x: "Mon", y: 10 },
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
    };
  }

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
  }

  /**
   *  Responsible for getting periodically the overview data
   */
  getOverviewDataStats() {
    let globalObject = this;

    if (this.props.App.loginData.admin_data !== null) {
      try {
        this.intervalPersister = setInterval(function () {
          globalObject.props.App.SOCKET_CORE.emit("getMastiff_insightData", {
            isolation_factor: "generic_view|daily_view",
            day_zoom: 30,
          });
        }, 5000);
      } catch (error) {
        clearInterval(this.intervalPersister);
      }
    } //Clear
    else {
      clearInterval(this.intervalPersister);
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
        </div>
        <div className={classes.chartContainer}>
          <FlexibleXYPlot xType="ordinal" height={400}>
            <VerticalGridLines />
            <HorizontalGridLines />
            <XAxis />
            <YAxis />
            <LineSeries
              className="vertical-bar-series-example"
              data={greenData}
              curve={"curveMonotoneX"}
              style={{
                strokeLinejoin: "round",
                strokeWidth: 2,
              }}
              color={"#09864A"}
            />
            <LineSeries
              data={blueData}
              curve={"curveMonotoneX"}
              color={"#096ED4"}
            />
          </FlexibleXYPlot>
        </div>
        <div>
          <div>Global numbers</div>
          <div>table 1</div>
          <div>table 2</div>
          <div>table 3</div>
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
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Overview);
