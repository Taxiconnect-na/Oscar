import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateSelectedDriverForCommDetails } from "../../Redux/HomeActionsCreators";
import classes from "./driverCommission.module.css";
import SOCKET_CORE from "../socket";
import NodeTableExplainer from "../../Helpers/NodeTableExplainer";
import Loader from "react-loader-spinner";

class driverCommission extends Component {
  constructor(props) {
    super(props);

    this.intervalPersister = null;
    this.SOCKET_CORE = SOCKET_CORE;

    this.state = {
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
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          response.response.header !== undefined &&
          response.stateHash !== undefined &&
          response.stateHash !== globalObject.state.distilledCoreData.stateHash
        ) {
          console.log(response);
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
      op: "getOverallData",
    });
    //...
    this.intervalPersister = setInterval(function () {
      globalObject.setState({ isSmallLoading: true });
      globalObject.SOCKET_CORE.emit("getDriversComissionFront", {
        op: "getOverallData",
      });
    }, 10000);
  }

  /**
   * Render a single column of data
   */
  renderDriverRow(driverInfos, index) {
    let hasGathered =
      driverInfos.remaining_commission !== undefined &&
      driverInfos.remaining_commission !== null &&
      parseFloat(driverInfos.remaining_commission) > 0;
    let isOverdueCommission = false;

    if (true) {
      let wCommission =
        driverInfos.remaining_commission - driverInfos.remaining_due_to_driver >
        0
          ? driverInfos.remaining_commission -
            driverInfos.remaining_due_to_driver
          : 0;

      if (driverInfos.remaining_commission >= 100) {
        return (
          <tr
            key={index}
            style={{
              backgroundColor: "rgba(9, 134, 74, 0.1)",
              border: "1px solid #09864A",
            }}
            onClick={() => {
              //Update the selected driver
              this.props.UpdateSelectedDriverForCommDetails(
                driverInfos.driver_infos.driver_fp
              );
              //...
              setTimeout(function () {
                window.location.href = "/CommissionDetailed";
              }, 200);
            }}
          >
            <td style={{ backgroundColor: "#09864A", color: "#fff" }}>
              {index}
            </td>
            <td style={{ textAlign: "left" }}>
              {driverInfos.driver_infos.name}
            </td>
            <td style={{ textAlign: "left" }}>
              {driverInfos.driver_infos.surname}
            </td>
            <td
              style={{ textAlign: "left" }}
              title={driverInfos.driver_infos.phone}
            >
              {driverInfos.driver_infos.phone.length > 14
                ? `${driverInfos.driver_infos.phone.substring(0, 12)}...`
                : driverInfos.driver_infos.phone}
            </td>
            <td>{driverInfos.driver_infos.taxi_number}</td>
            <td
              style={{
                fontFamily: "MoveTextBold",
                backgroundColor: "#f0f0f0",
                color: "#000",
              }}
              title={"Commission before substracting the wallet amount."}
            >
              {driverInfos.remaining_commission !== undefined
                ? driverInfos.remaining_commission
                : 0}
            </td>
            <td>
              {driverInfos.remaining_due_to_driver !== undefined
                ? driverInfos.remaining_due_to_driver
                : 0}
            </td>
            <td
              style={{
                fontFamily: "MoveTextBold",
                backgroundColor: "#09864A",
                color: "#fff",
              }}
              title={"Commission after substracting the wallet amount."}
            >
              {wCommission.toFixed(2)}
            </td>
            <td>{`${new Date(driverInfos.scheduled_payment_date)
              .toLocaleDateString()
              .replace(/\//g, "-")} at ${new Date(
              driverInfos.scheduled_payment_date
            ).toLocaleTimeString()}`}</td>
            <td
              style={{
                fontFamily: "MoveTextBold",
                backgroundColor: "#f0f0f0",
                color: "#000",
              }}
              title={
                "The global daily income for the driver computed based on all the taken trips."
              }
            >
              {driverInfos.average_daily_income !== undefined
                ? Math.round(driverInfos.average_daily_income)
                : 0}
            </td>
            <td
              style={{
                backgroundColor: driverInfos.driver_infos.is_suspended
                  ? "red"
                  : "#fff",
                color: driverInfos.driver_infos.is_suspended ? "#fff" : "#000",
              }}
            >
              {driverInfos.driver_infos.is_suspended ? "Suspended" : "Active"}
            </td>
          </tr>
        );
      } else {
        return (
          <tr
            key={index}
            style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff" }}
            onClick={() => {
              //Update the selected driver
              this.props.UpdateSelectedDriverForCommDetails(
                driverInfos.driver_infos.driver_fp
              );
              //...
              setTimeout(function () {
                window.location.href = "/CommissionDetailed";
              }, 200);
            }}
          >
            <td>{index}</td>
            <td style={{ textAlign: "left" }}>
              {driverInfos.driver_infos.name}
            </td>
            <td style={{ textAlign: "left" }}>
              {driverInfos.driver_infos.surname}
            </td>
            <td
              style={{ textAlign: "left" }}
              title={driverInfos.driver_infos.phone}
            >
              {driverInfos.driver_infos.phone.length > 14
                ? `${driverInfos.driver_infos.phone.substring(0, 12)}...`
                : driverInfos.driver_infos.phone}
            </td>
            <td>{driverInfos.driver_infos.taxi_number}</td>
            <td
              style={{
                fontFamily: "MoveTextBold",
              }}
              title={"Commission before substracting the wallet amount."}
            >
              {driverInfos.remaining_commission !== undefined
                ? driverInfos.remaining_commission
                : 0}
            </td>
            <td>
              {driverInfos.remaining_due_to_driver !== undefined
                ? driverInfos.remaining_due_to_driver
                : 0}
            </td>
            <td
              style={{
                fontFamily: "MoveTextBold",
              }}
              title={"Commission after substracting the wallet amount."}
            >
              {wCommission.toFixed(2)}
            </td>
            <td>{`${new Date(driverInfos.scheduled_payment_date)
              .toLocaleDateString()
              .replace(/\//g, "-")} at ${new Date(
              driverInfos.scheduled_payment_date
            ).toLocaleTimeString()}`}</td>
            <td
              style={{
                fontFamily: "MoveTextBold",
                backgroundColor: "#f0f0f0",
                color: "#000",
              }}
              title={
                "The global daily income for the driver computed based on all the taken trips."
              }
            >
              {driverInfos.average_daily_income !== undefined
                ? Math.round(driverInfos.average_daily_income)
                : 0}
            </td>
            <td
              style={{
                backgroundColor: driverInfos.driver_infos.is_suspended
                  ? "red"
                  : "#fff",
                color: driverInfos.driver_infos.is_suspended ? "#fff" : "#000",
              }}
            >
              {driverInfos.driver_infos.is_suspended ? "Suspended" : "Active"}
            </td>
          </tr>
        );
      }
    } else {
      return <></>;
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
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div>Drivers commission</div>
            {this.state.isSmallLoading && this.state.isLoading === false ? (
              <div style={{ marginLeft: 20 }}>
                <Loader
                  type="TailSpin"
                  color="#000"
                  height={15}
                  width={15}
                  timeout={300000000} //3 secs
                />
              </div>
            ) : (
              <></>
            )}
          </div>
          <div className={classes.switchView}>
            {Object.keys(this.state.distilledCoreData).length > 0
              ? this.state.distilledCoreData.response.driversData.length
              : 0}{" "}
            drivers
          </div>
        </div>

        {/* Summary */}
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
            <div
              className={classes.globalNumbersContainer}
              style={{ marginTop: 20 }}
            >
              <div className={classes.headerGBNumbers}>Quick look</div>
              <NodeTableExplainer
                title=""
                left={[
                  {
                    title: "Total commission pending",
                    value: `N$ ${Math.round(
                      this.state.distilledCoreData.response.header
                        .total_commission
                    )}`,
                    color: "#09864A",
                  },
                  {
                    title: "Total wallet due",
                    value: `N$ ${Math.round(
                      this.state.distilledCoreData.response.header
                        .total_wallet_due
                    )}`,
                  },
                  {
                    title: "Average global daily income",
                    value: `N$ ${Math.round(
                      this.state.distilledCoreData.response.header
                        .average_daily_income
                    )}`,
                  },
                ]}
                right={[
                  {
                    title: "Currency",
                    value:
                      this.state.distilledCoreData.response.header.currency,
                  },
                  {
                    title: "Last updated",
                    value: new Date(
                      this.state.distilledCoreData.response.header.last_date_update
                    )
                      .toTimeString()
                      .split(" ")[0],
                  },
                ]}
              />
            </div>

            {/* List of commission */}
            <div className={classes.listCommissionContainer}>
              <table>
                <thead className={classes.headerTable}>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Phone</th>
                    <th>Taxi number</th>
                    <th>Commission (N$)</th>
                    <th>Wallet balance (N$)</th>
                    <th>W-commission (N$)</th>
                    <th>Scheduled payment</th>
                    <th>Daily income (N$)</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody className={classes.bodyTableContainer}>
                  {this.state.distilledCoreData.response.driversData.map(
                    (driverInfos, index) => {
                      return this.renderDriverRow(driverInfos, index + 1);
                    }
                  )}
                </tbody>
              </table>
            </div>
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
      UpdateSelectedDriverForCommDetails,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(driverCommission);
