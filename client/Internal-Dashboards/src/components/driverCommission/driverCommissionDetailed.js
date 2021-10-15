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
import { MdInfo, MdDescription, MdReportProblem } from "react-icons/md";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const FlexibleXYPlot = makeWidthFlexible(XYPlot);

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "1px solid #fff",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export class driverCommissionDetailed extends Component {
  constructor(props) {
    super(props);

    if (
      this.props.App.selectedDriverForCommissionDetails === null ||
      (this.props.App.selectedDriverForCommissionDetails === null) ===
        undefined ||
      this.props.App.selectedDriverForCommissionDetails === ""
    ) {
      window.location.href = "/Commission";
    }

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      crosshairValues: [],
      distilledCoreData: {}, //Will hold the core data
      isLoading: true, //If the man window is loading
      isSmallLoading: false, //If the perister is loading
      isLoadingSettlement: false, //If loading for the settlement
      //...Graph settings
      yearSelected: null,
      periodSelected: "daily",
      weekSelected: null,
      typeSelected: "earnings",
      //...
      filteredData: [], //The data selected by deduction
      //...Commission settlement options
      settlementOption: "commissionSettlement",
      valueSettlement: 0,
      //Checkboxes
      shouldClearOutstandingCommission: false,
      shouldClearWallet: false,
      //Errors management
      showErrorWarning: false,
      //Settlement feedbacks
      someErrorsHappened: false, //After the settlement request is complete - false: successful, true: errored
      showModalFeedback: false, //If to show the modal infos for success or error or not.
      flag_errorFeedback: "error", //The error name returned
    };
  }

  componentWillMount() {
    if (
      this.props.App.selectedDriverForCommissionDetails === null ||
      (this.props.App.selectedDriverForCommissionDetails === null) ===
        undefined ||
      this.props.App.selectedDriverForCommissionDetails === ""
    ) {
      window.location.href = "/Commission";
    }
  }

  componentDidMount() {
    let globalObject = this;

    if (
      this.props.App.selectedDriverForCommissionDetails === null ||
      (this.props.App.selectedDriverForCommissionDetails === null) ===
        undefined ||
      this.props.App.selectedDriverForCommissionDetails === ""
    ) {
      window.location.href = "/Commission";
    }

    this.startIntervalDataFetcher();

    //...
    //Handle socket io responses
    this.SOCKET_CORE.on(
      "getDriversComissionFront-response",
      function (response) {
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

    //1. Handle settlement events
    this.SOCKET_CORE.on(
      "settleCommissionOrWallet_io-response",
      function (response) {
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          /error/i.test(response.response) === false
        ) {
          //SUCCESS
          globalObject.setState({
            flag_errorFeedback: "error",
            someErrorsHappened: false,
            showModalFeedback: true,
            isLoadingSettlement: false,
          });
        } //Some error happened
        else {
          globalObject.setState({
            flag_errorFeedback:
              response.response !== undefined ? response.response : "error",
            someErrorsHappened: true,
            showModalFeedback: true,
            isLoadingSettlement: false,
          });
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
      driver_fingerprint: this.props.App.selectedDriverForCommissionDetails,
    });
    //...
    this.intervalPersister = setInterval(function () {
      globalObject.setState({ isSmallLoading: true });
      globalObject.SOCKET_CORE.emit("getDriversComissionFront", {
        op: "getTargetedData",
        driver_fingerprint:
          globalObject.props.App.selectedDriverForCommissionDetails,
      });
    }, 2000);
  }

  /**
   * Responsible for getting the details for the graph settings bar
   * @param setting: year, period, week and types?
   */
  getGraphSettingsFills(setting) {
    if (/year/i.test(setting)) {
      let arrayDataAggr = [];
      for (let key in this.state.distilledCoreData.response.graphReadyData
        .yearly_view.earnings_related) {
        arrayDataAggr.push(key);
      }

      arrayDataAggr.sort();

      //...
      return arrayDataAggr.map((el, index) => {
        //! Auto assign the value for the year if null
        if (this.state.yearSelected === null) {
          this.state.yearSelected = el;
          this.renderAppropriateDataTypes();
        }

        return (
          <option key={index} value={el}>
            {el}
          </option>
        );
      });
    } else if (/week/i.test(setting)) {
      let arrayDataAggr = [];
      for (let key in this.state.distilledCoreData.response.graphReadyData
        .daily_view.earnings_related) {
        //? Only get for the selected year
        let regexChecker = new RegExp(`${this.state.yearSelected}`, "i");
        if (regexChecker.test(key)) {
          arrayDataAggr.push(key.split("-")[0]);
        }
      }
      //...
      arrayDataAggr.sort();
      //...
      return arrayDataAggr.map((el, index) => {
        //! Auto assign the value for the week if null
        if (this.state.weekSelected === null) {
          this.state.weekSelected = el;
          this.renderAppropriateDataTypes();
        }

        return (
          <option key={index} value={el}>
            {el}
          </option>
        );
      });
    } else {
      <></>;
    }
  }

  /**
   * Render the correct set of data based on the selected settings
   */
  renderAppropriateDataTypes() {
    if (/earnings/i.test(this.state.typeSelected)) {
      //Earnings data
      if (/daily/i.test(this.state.periodSelected)) {
        //Daily data
        //Check for the week
        let specificKey = `${this.state.weekSelected}-${this.state.yearSelected}`;
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.daily_view
              .earnings_related[specificKey],
        });
      } else if (/weekly/i.test(this.state.periodSelected)) {
        //Weekly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.weekly_view
              .earnings_related[this.state.yearSelected],
        });
      } else if (/monthly/i.test(this.state.periodSelected)) {
        //Monthly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.montly_view
              .earnings_related[this.state.yearSelected],
        });
      } else if (/yearly/i.test(this.state.periodSelected)) {
        //Yearly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.yearly_view
              .earnings_related[this.state.yearSelected],
        });
      }
      //Non data
      else {
        return [];
      }
    } else if (/requests/i.test(this.state.typeSelected)) {
      //Requests data
      if (/daily/i.test(this.state.periodSelected)) {
        //Daily data
        //Check for the week
        let specificKey = `${this.state.weekSelected}-${this.state.yearSelected}`;
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.daily_view
              .requests_related[specificKey],
        });
      } else if (/weekly/i.test(this.state.periodSelected)) {
        //Weekly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.weekly_view
              .requests_related[this.state.yearSelected],
        });
      } else if (/monthly/i.test(this.state.periodSelected)) {
        //Monthly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.montly_view
              .requests_related[this.state.yearSelected],
        });
      } else if (/yearly/i.test(this.state.periodSelected)) {
        //Yearly data - check for the year
        this.setState({
          filteredData:
            this.state.distilledCoreData.response.graphReadyData.yearly_view
              .requests_related[this.state.yearSelected],
        });
      }
      //Non data
      else {
        return [];
      }
    } //No data
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
    let DATA = [this.state.filteredData, []];
    //....
    this.setState({ crosshairValues: DATA.map((d) => d[index]) });
  };

  /**
   * Responsible for updating the drivers financial account.
   */
  updateDriverFinancialAccount() {
    //Check if an option was specified with substancial values to back it up.
    if (
      this.state.valueSettlement > 0 ||
      this.state.shouldClearOutstandingCommission ||
      this.state.shouldClearWallet
    ) {
      let bundleFinancialUpdate = {
        driver_fingerprint: this.props.App.selectedDriverForCommissionDetails,
        settlementOption: this.state.settlementOption,
        valueSettlement: this.state.valueSettlement,
        shouldClearOutstandingCommission:
          this.state.shouldClearOutstandingCommission,
        shouldClearWallet: this.state.shouldClearWallet,
        financialBrief: {
          remaining_commission:
            this.state.distilledCoreData.response.driversData[0]
              .remaining_commission,
          wallet_balance:
            this.state.distilledCoreData.response.driversData[0]
              .remaining_due_to_driver,
        },
      };
      //...
      this.setState({
        isLoadingSettlement: true,
        valueSettlement: 0,
        shouldClearOutstandingCommission: false,
        shouldClearWallet: false,
      });

      this.SOCKET_CORE.emit(
        "settleCommissionOrWallet_io",
        bundleFinancialUpdate
      );
    } //Error
    else {
      this.setState({ showErrorWarning: true });
    }
  }

  render() {
    if (
      this.props.App.selectedDriverForCommissionDetails === null ||
      (this.props.App.selectedDriverForCommissionDetails === null) ===
        undefined ||
      this.props.App.selectedDriverForCommissionDetails === ""
    ) {
      window.location.href = "/Commission";
    }

    let xAxisLabels = {
      daily: "Days",
      weekly: "Weeks",
      monthly: "Months",
      yearly: "Years",
    };

    return (
      <div
        style={{
          padding: "10px",
          marginTop: "10px",
          overflowX: "hidden",
          marginBottom: "100px",
        }}
      >
        <Modal
          open={this.state.showModalFeedback}
          onClose={() =>
            this.setState({
              showModalFeedback: false,
              someErrorsHappened: false,
            })
          }
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          {this.state.someErrorsHappened ? (
            <Box sx={style}>
              <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                style={{ fontWeight: "bold", fontSize: 15, color: "#b22222" }}
              >
                Unable to make the changes
              </Typography>
              {/error_incoherent_dataRefs/i.test(
                this.state.flag_errorFeedback
              ) ? (
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  It looks like you are trying to update the driver account
                  before your previous change has taken effect, please wait for
                  about 1 min for your previous change to take effect and try
                  again.
                </Typography>
              ) : (
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                  I was unable to make the desired chages due to some unexpected
                  error, please try refreshing this window and try again, or if
                  it persists, drop an email with a screenshot and detailed of
                  the problem at <strong>dominique@taxiconnectna.com</strong>
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={style}>
              <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                style={{
                  fontFamily: "MoveTextBold",
                  fontSize: 15,
                  color: "#09864A",
                }}
              >
                Account successfully updated.
              </Typography>
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                The changes to the driver's financial account have been
                successfully applied, and they should be visible within the next
                2 minutes.
              </Typography>
            </Box>
          )}
        </Modal>

        {this.state.isLoading ? (
          <div
            style={{
              width: "100%",
              height: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div>
              <Loader
                type="TailSpin"
                color="#000"
                height={40}
                width={40}
                timeout={300000000} //3 secs
              />
            </div>
          </div>
        ) : Object.keys(this.state.distilledCoreData).length === 0 ? (
          <div
            style={{
              width: "100%",
              height: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            I was unable to find commissions data, please try refreshing the
            page.
          </div>
        ) : (
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
                  <div
                    className={classes.driverNameText}
                  >{`${this.state.distilledCoreData.response.driversData[0].driver_infos.name} ${this.state.distilledCoreData.response.driversData[0].driver_infos.surname}`}</div>
                  <div className={classes.driverNo}>
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .driver_infos.taxi_number
                    }
                  </div>
                </div>
              </div>
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

            <div className={classes.chartContainer}>
              <FlexibleXYPlot xType="ordinal" height={400} stackBy="y">
                <VerticalGridLines />
                <HorizontalGridLines />
                <XAxis
                  title={xAxisLabels[this.state.periodSelected]}
                  position={"middle"}
                />
                <YAxis
                  tickFormat={(v) =>
                    /\./i.test(String(v))
                      ? null
                      : /earnings/i.test(this.state.typeSelected)
                      ? `$${v}`
                      : v
                  }
                  left={15}
                />
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

                <VerticalBarSeries
                  data={
                    this.state.filteredData !== undefined &&
                    this.state.filteredData !== null &&
                    this.state.filteredData.length > 0
                      ? this.state.filteredData
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
                    title: /earnings/i.test(this.state.typeSelected)
                      ? "Earnings"
                      : "Requests",
                    value: /earnings/i.test(this.state.typeSelected)
                      ? `N$${d[0].y}`
                      : d[0].y,
                  })}
                  itemsFormat={(d) => [
                    {
                      title: xAxisLabels[this.state.periodSelected].replace(
                        /s$/,
                        ""
                      ),
                      value: d[0].x,
                    },
                  ]}
                />
              </FlexibleXYPlot>
            </div>
            {/* Graph settings */}
            <div className={classes.graphSettings}>
              {/* Year */}
              <div>
                <div className={classes.labelGraphSettings}>Year</div>
                <select
                  className={classes.selectGenericBasic}
                  onChange={(val) => {
                    this.state.yearSelected = val.target.value;
                    this.renderAppropriateDataTypes();
                  }}
                >
                  {this.getGraphSettingsFills("year")}
                </select>
              </div>
              {/* Period */}
              <div>
                <div className={classes.labelGraphSettings}>Period</div>
                <select
                  className={classes.selectGenericBasic}
                  onChange={(val) => {
                    this.state.periodSelected = val.target.value;
                    this.renderAppropriateDataTypes();
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {/* Week number */}
              {/daily/i.test(this.state.periodSelected) ? (
                <div>
                  <div className={classes.labelGraphSettings}>Week</div>
                  <select
                    className={classes.selectGenericBasic}
                    style={{ width: 80 }}
                    onChange={(val) => {
                      this.state.weekSelected = val.target.value;
                      this.renderAppropriateDataTypes();
                    }}
                  >
                    {this.getGraphSettingsFills("week")}
                  </select>
                </div>
              ) : (
                <></>
              )}
              {/* Type */}
              <div>
                <div className={classes.labelGraphSettings}>Type</div>
                <select
                  className={classes.selectGenericBasic}
                  style={{ width: 150 }}
                  onChange={(val) => {
                    this.state.typeSelected = val.target.value;
                    this.renderAppropriateDataTypes();
                  }}
                >
                  <option value="earnings">Earnings</option>
                  <option value="requests">Requests</option>
                </select>
              </div>
            </div>

            {/* Profile view */}
            <div className={classes.profileContainer}>
              <div className={classes.profilePicContainer}>
                <img
                  alt="profile"
                  src={
                    this.state.distilledCoreData.response.driversData[0]
                      .driver_infos.profile_pic
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className={classes.personalDetContainer}>
                <div className={classes.lineDetailInfo}>
                  <div className={classes.labelPersonalInfos}>Name</div>
                  <div className={classes.detailInfoReal}>
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .driver_infos.name
                    }
                  </div>
                </div>
                {/* surname */}
                <div className={classes.lineDetailInfo}>
                  <div className={classes.labelPersonalInfos}>Surname</div>
                  <div className={classes.detailInfoReal}>
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .driver_infos.surname
                    }
                  </div>
                </div>
                {/* Phone */}
                <div className={classes.lineDetailInfo}>
                  <div className={classes.labelPersonalInfos}>Phone</div>
                  <div className={classes.detailInfoReal}>
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .driver_infos.phone
                    }
                  </div>
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
                    N${" "}
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .remaining_commission
                    }
                  </div>
                </div>
                {/* Wallet balance */}
                <div className={classes.lineDetailInfo}>
                  <div className={classes.labelPersonalInfos}>
                    Wallet balance
                  </div>
                  <div className={classes.detailInfoReal}>
                    N${" "}
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .remaining_due_to_driver
                    }
                  </div>
                </div>
                {/* Currency */}
                <div className={classes.lineDetailInfo}>
                  <div className={classes.labelPersonalInfos}>Currency</div>
                  <div className={classes.detailInfoReal}>
                    {
                      this.state.distilledCoreData.response.driversData[0]
                        .currency
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Commission ops */}
            <div className={classes.subTitleGeneric}>Settlement</div>
            <div className={classes.settlementContainer}>
              {this.state.isLoadingSettlement ? (
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader
                    type="TailSpin"
                    color="#000"
                    height={25}
                    width={25}
                    timeout={300000000} //3 secs
                  />
                  <div style={{ fontSize: 15, marginTop: 25 }}>
                    Updating the account...
                  </div>
                </div>
              ) : (
                <>
                  <div className={classes.infoGeneric}>
                    <MdInfo
                      style={{ position: "relative", top: 3, marginRight: 5 }}
                    />{" "}
                    <div>
                      Use this tool to pay the driver's commission or to empty
                      the wallet after settlement.
                      <br />
                      <strong>
                        It might take about 2 min before the update is applied
                        to the driver's financial records.
                      </strong>
                    </div>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Amount (N$)"
                      className={classes.inputGeneric}
                      disabled={
                        /commissionSettlement/i.test(
                          this.state.settlementOption
                        )
                          ? this.state.shouldClearOutstandingCommission
                          : this.state.shouldClearWallet
                      }
                      value={
                        /commissionSettlement/i.test(
                          this.state.settlementOption
                        )
                          ? this.state.shouldClearOutstandingCommission
                            ? this.state.distilledCoreData.response
                                .driversData[0].remaining_commission
                            : this.state.valueSettlement
                          : this.state.shouldClearWallet
                          ? this.state.distilledCoreData.response.driversData[0]
                              .remaining_due_to_driver
                          : this.state.valueSettlement
                      }
                      onChange={(val) => {
                        let relativeMax = /commissionSettlement/i.test(
                          this.state.settlementOption
                        )
                          ? this.state.distilledCoreData.response.driversData[0]
                              .remaining_commission
                          : this.state.distilledCoreData.response.driversData[0]
                              .remaining_due_to_driver;
                        //...
                        if (val.target.value > relativeMax) {
                          this.setState({
                            valueSettlement: relativeMax,
                            showErrorWarning: false,
                          });
                        } else if (val.target.value < 0) {
                          this.setState({
                            valueSettlement: 0,
                            showErrorWarning: false,
                          });
                        }
                        //Within bounds
                        else {
                          this.setState({
                            valueSettlement: parseFloat(val.target.value),
                            showErrorWarning: false,
                          });
                        }
                      }}
                    />
                    <select
                      className={classes.selectGenericBasic}
                      style={{
                        width: 230,
                        padding: 11,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        backgroundColor: "#f0f0f0",
                        position: "relative",
                        bottom: 0.5,
                      }}
                      onChange={(val) => {
                        this.state.settlementOption = val.target.value;
                        //! Update the previous settlement values
                        let relativeMax = /commissionSettlement/i.test(
                          this.state.settlementOption
                        )
                          ? this.state.distilledCoreData.response.driversData[0]
                              .remaining_commission
                          : this.state.distilledCoreData.response.driversData[0]
                              .remaining_due_to_driver;
                        //...
                        if (this.state.valueSettlement > relativeMax) {
                          this.setState({
                            valueSettlement: relativeMax,
                            showErrorWarning: false,
                          });
                        } //Within bounds
                        else {
                          this.setState({
                            valueSettlement: this.state.valueSettlement,
                            showErrorWarning: false,
                          });
                        }
                      }}
                    >
                      <option value="commissionSettlement">
                        Commission settlement
                      </option>
                      <option value="walletSettlement">
                        Wallet settlement
                      </option>
                    </select>
                  </div>
                  {/* Max amount notice */}
                  <div className={classes.maxQuotasSettlements}>
                    <div className={classes.lineMaxQuotasSett}>
                      <div className={classes.labelMaxQStt}>Max commission</div>{" "}
                      N$
                      {
                        this.state.distilledCoreData.response.driversData[0]
                          .remaining_commission
                      }
                    </div>
                    <div className={classes.lineMaxQuotasSett}>
                      <div className={classes.labelMaxQStt}>Max wallet</div> N$
                      {
                        this.state.distilledCoreData.response.driversData[0]
                          .remaining_due_to_driver
                      }
                    </div>
                  </div>
                  {/* Options */}
                  <div>
                    <input
                      type="checkbox"
                      id="clearCommission"
                      name="clearCommission"
                      value={this.state.shouldClearOutstandingCommission}
                      onChange={(val) => {
                        this.setState({
                          shouldClearOutstandingCommission: val.target.checked,
                          showErrorWarning: false,
                        });
                      }}
                    />
                    <label
                      htmlFor="clearCommission"
                      className={classes.settlementLabelBasic}
                    >
                      Clear the outstanding commission
                    </label>
                    <br />
                    <input
                      type="checkbox"
                      id="emptyWallet"
                      name="emptyWallet"
                      value={this.state.shouldClearWallet}
                      onChange={(val) => {
                        this.setState({
                          shouldClearWallet: val.target.checked,
                          showErrorWarning: false,
                        });
                      }}
                    />
                    <label
                      htmlFor="emptyWallet"
                      className={classes.settlementLabelBasic}
                    >
                      Clear the wallet
                    </label>
                  </div>

                  {/* Submit */}
                  <div className={classes.submitField}>
                    {this.state.showErrorWarning ? (
                      <div className={classes.errorContainer}>
                        <MdReportProblem
                          style={{
                            position: "relative",
                            marginRight: 4,
                            width: 20,
                            height: 20,
                          }}
                        />
                        <span>
                          Please provide substancial information about how you
                          would like to update the account.
                        </span>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <div
                      className={classes.genericButton}
                      onClick={() =>
                        this.state.isLoadingSettlement === false
                          ? this.updateDriverFinancialAccount()
                          : {}
                      }
                    >
                      {this.state.isLoadingSettlement ? (
                        <Loader
                          type="TailSpin"
                          color="#fff"
                          height={23}
                          width={23}
                          timeout={300000000} //3 secs
                        />
                      ) : (
                        <>
                          <MdDescription
                            style={{
                              marginRight: 5,
                              position: "relative",
                              bottom: 1,
                            }}
                          />{" "}
                          Apply
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div></div>
          </>
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
      UpdateSuccessfullLoginDetails,
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(driverCommissionDetailed);
