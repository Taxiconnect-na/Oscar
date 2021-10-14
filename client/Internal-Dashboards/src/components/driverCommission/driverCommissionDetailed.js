import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import classes from "./driverCommission.module.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import SOCKET_CORE from "../socket";

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
import { MdInfo, MdDescription } from "react-icons/md";

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

export class driverCommissionDetailed extends Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.state = {
      crosshairValues: [],
      distilledCoreData: {}, //Will hold the core data
      isLoading: true, //If the man window is loading
      isSmallLoading: false, //If the perister is loading
    };
  }

  componentDidMount() {
    let globalObject = this;

    this.startIntervalDataFetcher();

    //...
    //Handle socket io responses
    this.SOCKET_CORE.on(
      "getDriversComissionFront-response",
      function (response) {
        console.log(response);
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          response.response.header !== undefined &&
          response.stateHash !== undefined &&
          response.stateHash !== globalObject.state.distilledCoreData.stateHash
        ) {
          globalObject.setState({
            distilledCoreData: response,
            isLoading: false,
            isSmallLoading: false,
          });
        } //Close the loaders
        else {
          globalObject.setState({ isLoading: false, isSmallLoading: false });
        }
      }
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalPersister);
  }

  startIntervalDataFetcher() {
    let globalObject = this;

    //Starter
    globalObject.SOCKET_CORE.emit("getDriversComissionFront", {
      op: "getTargetedData",
      driver_fingerprint:
        "898ee18c07a91d4f03567e7003595708db1a6e1f15d107645fc49aaf005e3aafd90b39c847a70100",
    });
    //...
    this.intervalPersister = setInterval(function () {
      globalObject.setState({ isSmallLoading: true });
      globalObject.SOCKET_CORE.emit("getDriversComissionFront", {
        op: "getTargetedData",
        driver_fingerprint:
          "898ee18c07a91d4f03567e7003595708db1a6e1f15d107645fc49aaf005e3aafd90b39c847a70100",
      });
    }, 10000);
  }

  render() {
    return (
      <div
        style={{
          padding: "10px",
          marginTop: "10px",
          overflowX: "hidden",
          marginBottom: "100px",
        }}
      >
        <>
          <div className={classes.headerGeneric}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div>Earnings</div>
              <div className={classes.driverNameContainer}>
                <div className={classes.driverNameText}>Lukas Kapenda</div>
                <div className={classes.driverNo}>P063</div>
              </div>
            </div>
            <div className={classes.switchView}>Graph settings for display</div>
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
                onValueMouseOut={this._onMouseLeave}
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
          </div>
          {/* Graph settings */}
          <div className={classes.graphSettings}>
            {/* Year */}
            <div>
              <div className={classes.labelGraphSettings}>Year</div>
              <select className={classes.selectGenericBasic}>
                <option value="">2021</option>
                <option value="">2020</option>
              </select>
            </div>
            {/* Period */}
            <div>
              <div className={classes.labelGraphSettings}>Period</div>
              <select className={classes.selectGenericBasic}>
                <option value="">Daily</option>
                <option value="">Weekly</option>
                <option value="">Monthly</option>
                <option value="">Yearly</option>
              </select>
            </div>
            {/* Week number */}
            <div>
              <div className={classes.labelGraphSettings}>Week</div>
              <select
                className={classes.selectGenericBasic}
                style={{ width: 80 }}
              >
                <option value="">1</option>
                <option value="">2</option>
              </select>
            </div>
            {/* Type */}
            <div>
              <div className={classes.labelGraphSettings}>Type</div>
              <select
                className={classes.selectGenericBasic}
                style={{ width: 150 }}
              >
                <option value="">Earnings</option>
                <option value="">Requests</option>
              </select>
            </div>
          </div>

          {/* Profile view */}
          <div className={classes.profileContainer}>
            <div className={classes.profilePicContainer}>
              <img
                alt="profile"
                src=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className={classes.personalDetContainer}>
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>Name</div>
                <div className={classes.detailInfoReal}>Lukas</div>
              </div>
              {/* surname */}
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>Surname</div>
                <div className={classes.detailInfoReal}>Kapendo</div>
              </div>
              {/* Phone */}
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>Phone</div>
                <div className={classes.detailInfoReal}>+26481000...</div>
              </div>
            </div>
            <div className={classes.commisionDetailsBrief}>
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>
                  Remaing commission
                </div>
                <div
                  className={classes.detailInfoReal}
                  style={{ color: "#09864A" }}
                >
                  N$ 640
                </div>
              </div>
              {/* Wallet balance */}
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>Wallet balance</div>
                <div className={classes.detailInfoReal}>N$ 100</div>
              </div>
              {/* Currency */}
              <div className={classes.lineDetailInfo}>
                <div className={classes.labelPersonalInfos}>Currency</div>
                <div className={classes.detailInfoReal}>USD</div>
              </div>
            </div>
          </div>

          {/* Commission ops */}
          <div className={classes.subTitleGeneric}>Settlement</div>
          <div className={classes.settlementContainer}>
            <div className={classes.infoGeneric}>
              <MdInfo
                style={{ position: "relative", top: 3, marginRight: 5 }}
              />{" "}
              <div>
                Use this tool to pay the driver's commission or to empty the
                wallet after settlement.
                <br />
                <strong>
                  It might take about 2 min before the update is applied to the
                  driver's financial records.
                </strong>
              </div>
            </div>
            <div>
              <input
                type="number"
                placeholder="Amount (N$)"
                className={classes.inputGeneric}
              />
              <select
                className={classes.selectGenericBasic}
                style={{
                  width: 230,
                  padding: 11,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  backgroundColor: "#f0f0f0",
                }}
              >
                <option value="">Commission settlement</option>
                <option value="">Wallet settlement</option>
              </select>
            </div>
            {/* Options */}
            <div>
              <input
                type="checkbox"
                id="emptyWallet"
                name="emptyWallet"
                value="true"
              />
              <label for="emptyWallet" className={classes.settlementLabelBasic}>
                Empty the wallet
              </label>
            </div>

            {/* Submit */}
            <div className={classes.submitField}>
              <div className={classes.genericButton}>
                <MdDescription
                  style={{ marginRight: 5, position: "relative", bottom: 1 }}
                />{" "}
                Apply
              </div>
            </div>
          </div>
          <div></div>
        </>
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
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(driverCommissionDetailed);
