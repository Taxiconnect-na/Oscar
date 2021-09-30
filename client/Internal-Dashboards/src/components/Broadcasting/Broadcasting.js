import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  UpdateSuccessfullLoginDetails,
  UpdateOverviewData,
  UpdateGlobalOverviewData,
} from "../../Redux/HomeActionsCreators";
import classes from "./Broadcasting.module.css";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Autocomplete, { matchStateToTerm, sortStates } from "react-autocomplete";
import {
  MdClear,
  MdCallSplit,
  MdCreate,
  MdRemoveCircle,
  MdCheckCircle,
  MdTrendingFlat,
  MdReportProblem,
} from "react-icons/md";
import Checkbox from "@mui/material/Checkbox";
import SOCKET_CORE from "../socket";
import Loader from "react-loader-spinner";
import { ReactSearchAutocomplete } from "react-search-autocomplete";

class Broadcasting extends React.Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      audience: "drivers", //drivers or riders
      recipient_type: "all", //The recipient to receive the notifications (all or specific)
      selected_drivers: [], //The driver selected in the case of "specific" targeting - {driver_no:XXXX, driver_fp:XXXX}
      notification_type: "normal", //The type of notification - normal, update, abuse, invitation, fare
      message_text: "", //The message to be sent
      shouldNotifyBy_pushNotif: true, //If a push notification should notify the drivers
      allowedToSend: false, //If all the required infos are supplied before sending - default: false
      foundSomeFormError: false, //If an error in the supplied data was found
      errorForm_text: "Please review the entered information before sending", //The message to be displayed when found an error in the inputed data
      maxMessageLimit: 500, //The text limit of the mmessage - default:500
      driversAutoCompleteData: [], //Will hold all the drivers auto complete data in case needed
      autoCompleteDriversTextValue: "Select some drivers",
      isLoadingSomething: true, //If a process is loading
      shouldShowSuccessPage: false, //If to show the success page
      shouldShowErrorPage: false, //If to show the error page
      loadingMessage: "Making the platform ready...", //The message to show while loading
      bufferReceivedDataDrivers_autocomplete: null, //The temporarily stored autocomplete data for the drivers
    };
  }

  componentDidMount() {
    let globalObject = this;

    this.getDriversAutocompleteData();
    console.log(this.props.App);

    /**
     * Handle socket io events
     */
    this.SOCKET_CORE.on(
      "getDriversGeneral_OverviewStatistics_io-response",
      function (response) {
        if (
          response !== undefined &&
          response !== null &&
          response.response === "success"
        ) {
          //?Optimized
          if (
            `${JSON.stringify(
              globalObject.state.bufferReceivedDataDrivers_autocomplete
            )}` !== `${JSON.stringify(response.data)}`
          ) {
            //! Close the loader as well
            let reformatTheData = response.data.map((driver, index) => {
              return {
                id: index,
                name: driver.taxi_no,
                // driver_fp: driver.driver_fp,
              };
            });
            //...
            globalObject.setState({
              driversAutoCompleteData: reformatTheData,
              bufferReceivedDataDrivers_autocomplete: response.data,
              isLoadingSomething: false,
            });
          }
        } //No data
        else {
          //Do nothing
        }
      }
    );

    /**
     * Handle the broadcasting action event
     */
    this.SOCKET_CORE.on(
      "broadCastNotifications_toUsers_io-response",
      function (response) {
        console.log(response);
        if (
          response !== undefined &&
          response !== null &&
          /dispatch_successful/i.test(response.response)
        ) {
          globalObject.setState({
            shouldShowErrorPage: false,
            isLoadingSomething: false,
            shouldShowSuccessPage: true,
          });
        } //Some error occured
        else {
          //Do nothing
          globalObject.setState({
            shouldShowErrorPage: true,
            isLoadingSomething: false,
            shouldShowSuccessPage: false,
          });
        }
      }
    );
  }

  getDriversAutocompleteData() {
    let globalObject = this;
    //...
    this.intervalPersister = setInterval(function () {
      globalObject.SOCKET_CORE.emit("getDriversGeneral_OverviewStatistics_io", {
        admin_fp: globalObject.props.App.loginData.admin_data.admin_fp,
        op: "getNumbers_andFp",
      });
    }, 2000);
  }

  sendBroadcastedMessage() {
    //?Do some checking
    if (/drivers/i.test(this.state.audience)) {
      //For the drivers
      //1. Check the recipients
      if (/specific/i.test(this.state.recipient_type)) {
        //Check if some specific drivers were specified
        if (this.state.selected_drivers.length > 0) {
          //Correct
          //Check if the message was written, with at least 15 chars
          if (this.state.message_text.length >= 15) {
            //CORRECCT
            this.setState({
              isLoadingSomething: true,
              loadingMessage: "Broadcasting the message...",
            });
            //...Pack the notification data obj
            let bundleData = this.state;
            bundleData.driversAutoCompleteData = null;
            bundleData["admin_fp"] =
              this.props.App.loginData.admin_data.admin_fp;
            //...
            this.SOCKET_CORE.emit(
              "broadCastNotifications_toUsers_io",
              bundleData
            );
          } //less characters than the required
          else {
            this.setState({
              foundSomeFormError: true,
              errorForm_text:
                "The message should have at least 15 characters, please review taht and try again.",
            });
          }
        } //!No specific drivers specified
        else {
          this.setState({
            foundSomeFormError: true,
            errorForm_text:
              "Please specify at least one driver to whom the message should be broadcasted.",
          });
        }
      } //?All
      else {
        //Check if the message was written, with at least 15 chars
        if (this.state.message_text.length >= 15) {
          //CORRECCT
          this.setState({
            isLoadingSomething: true,
            loadingMessage: "Broadcasting the message...",
          });
          //...Pack the notification data obj
          let bundleData = this.state;
          bundleData.driversAutoCompleteData = null;
          bundleData["admin_fp"] = this.props.App.loginData.admin_data.admin_fp;
          //...
          this.SOCKET_CORE.emit(
            "broadCastNotifications_toUsers_io",
            bundleData
          );
        } //less characters than the required
        else {
          this.setState({
            foundSomeFormError: true,
            errorForm_text:
              "The message should have at least 15 characters, please review taht and try again.",
          });
        }
      }
    } else if (/riders/i.test(this.state.audience)) {
      //Riders
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
        {this.state.isLoadingSomething ? (
          <div
            style={{
              width: "100%",
              height: "50vh",
              margin: "auto",
              // border: "1px solid black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <Loader
              type="TailSpin"
              color="#096ED4"
              height={50}
              width={50}
              timeout={300000000} //3 secs
            />
            <br />
            <div style={{ fontSize: 15, marginTop: 20 }}>
              {this.state.loadingMessage}
            </div>
          </div>
        ) : this.state.shouldShowSuccessPage ? (
          <div
            style={{
              width: "100%",
              height: "90vh",
              margin: "auto",
              // border: "1px solid black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                //   border: "1px solid black",
                display: "flex",
                height: 400,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                margin: "auto",
                width: "70%",
                textAlign: "center",
              }}
            >
              <MdCheckCircle
                style={{ width: 35, height: 35, marginBottom: 25 }}
                color={"#09864A"}
              />
              The message had been successfully broadcasted.
              <div
                className={classes.formBasicSubmitBttnClassicsReceiverInfos}
                style={{ marginTop: 60, borderRadius: 3 }}
                onClick={() => {
                  window.location.href = "/Broadcasting";
                }}
              >
                Close
              </div>
            </div>
          </div>
        ) : this.state.shouldShowErrorPage ? (
          <div
            style={{
              //   border: "1px solid black",
              display: "flex",
              height: 400,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              margin: "auto",
              width: "70%",
              textAlign: "center",
            }}
          >
            <MdReportProblem
              style={{ width: 35, height: 35, marginBottom: 25 }}
              color={"#b22222"}
            />
            Sorry we were unable to broadcast the message due to an unexpected
            error, please refresh you web page and try again. If it persists
            please contact support at{" "}
            <strong>dominique@taxiconnectna.com</strong>
            <div
              style={{
                marginTop: 30,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#096ED4",
              }}
              onClick={() => (window.location.href = "/Broadcasting")}
            >
              Try fixing the issue{" "}
              <MdTrendingFlat
                style={{ position: "relative", top: 2, marginLeft: 5 }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className={classes.headerGeneric}>
              <div>Broadcasting</div>
            </div>
            <div className={classes.contentContainer}>
              <div className={classes.typicalNotice}>
                Please select the category of users you want to reach.
              </div>
              <div className={classes.headerOptions}>
                <div
                  style={{
                    backgroundColor: /drivers/i.test(this.state.audience)
                      ? "#096ed4"
                      : "#f0f0f0",
                    borderColor: /drivers/i.test(this.state.audience)
                      ? "#096ed4"
                      : "#d0d0d0",
                    color: /drivers/i.test(this.state.audience)
                      ? "#fff"
                      : "#000",
                  }}
                >
                  Drivers
                </div>
                <div
                  style={{
                    backgroundColor: /riders/i.test(this.state.audience)
                      ? "#096ed4"
                      : "#f0f0f0",
                    borderColor: /riders/i.test(this.state.audience)
                      ? "#096ed4"
                      : "#d0d0d0",
                    color: /riders/i.test(this.state.audience)
                      ? "#fff"
                      : "#000",
                    opacity: 0.3,
                    cursor: "default",
                  }}
                >
                  Riders
                </div>
              </div>
              {/* Recipient selection */}
              <div className={classes.recipientSelectionContainer}>
                <div className={classes.typicalLabel}>Recipient</div>
                <Select
                  labelId="selectRecipient"
                  id="recipientSelection"
                  value={this.state.recipient_type}
                  label="Recipient"
                  onChange={(val) => {
                    this.setState({
                      recipient_type: val.target.value,
                      foundSomeFormError: false,
                    });
                  }}
                  className={classes.selectBasicStyle}
                >
                  <MenuItem value={"all"}>All drivers</MenuItem>
                  <MenuItem value={"specific"}>Just specific drivers</MenuItem>
                </Select>
                {/* Autocomplete */}
                <div>
                  {/specific/i.test(this.state.recipient_type) ? (
                    <>
                      <div style={{ width: 400, marginTop: 20 }}>
                        <ReactSearchAutocomplete
                          items={this.state.driversAutoCompleteData}
                          // onSearch={(string, results) => console.log(string, results)}
                          // onHover={(val) => console.log(val)}
                          onSelect={(val) => {
                            let oldDriverList = this.state.selected_drivers;
                            oldDriverList.push(val.name);
                            oldDriverList = [...new Set(oldDriverList)];
                            //...
                            this.setState({ selected_drivers: oldDriverList });
                          }}
                          // onFocus={(val) => console.log(val)}
                          placeholder="Select some drivers"
                          formatResult={(item) => item}
                          styling={{
                            height: "40px",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            backgroundColor: "white",
                            boxShadow: "none",
                            hoverBackgroundColor: "#d0d0d0",
                            fontFamily: "MoveTextMedium",
                            color: "#000",
                            fontSize: "16px",
                            // fontFamily: "Courier",
                            iconColor: "#0e8491",
                            lineColor: "#d0d0d0",
                            placeholderColor: "#7c6e6ebb",
                            clearIconMargin: "3px 8px 0 0",
                            zIndex: 100000,
                          }}
                        />
                      </div>

                      {/* Selected renderer */}
                      <div className={classes.selectedDriversContainer}>
                        {this.state.selected_drivers.map((driver) => {
                          return (
                            <div className={classes.selectedDriverNode}>
                              <div className={classes.taxiNoSelectedSide}>
                                {driver}
                              </div>
                              <div className={classes.removeSelectedSide}>
                                <MdClear
                                  style={{
                                    width: 20,
                                    height: 20,
                                    position: "relative",
                                    bottom: 2,
                                  }}
                                  onClick={() => {
                                    let oldDriverList =
                                      this.state.selected_drivers;
                                    oldDriverList.splice(
                                      oldDriverList.indexOf(driver),
                                      1
                                    );
                                    //console.log(oldDriverList.indexOf(driver));
                                    //...
                                    this.setState({
                                      selected_drivers: oldDriverList,
                                      foundSomeFormError: false,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}

                  {/* Notification type */}
                  <div style={{ marginTop: 40 }}>
                    <div className={classes.typicalLabel}>
                      Notification type
                    </div>
                    <Select
                      labelId="selectNotificationFam"
                      id="notificationFamSelection"
                      value={this.state.notification_type}
                      label="Notification type"
                      onChange={(val) => {
                        this.setState({
                          notification_type: val.target.value,
                          foundSomeFormError: false,
                        });
                      }}
                      className={classes.selectBasicStyle}
                    >
                      <MenuItem value={"normal"}>Normal</MenuItem>
                      <MenuItem value={"update"}>New update</MenuItem>
                      <MenuItem value={"abuse"}>Abuse alert</MenuItem>
                      <MenuItem value={"invitation"}>Invitation</MenuItem>
                      <MenuItem value={"fare"}>Change of fares</MenuItem>
                      <MenuItem value={"policy"}>New Policy update</MenuItem>
                    </Select>
                  </div>

                  {/* Message */}
                  <div style={{ marginTop: 40 }}>
                    <div className={classes.typicalLabel}>Message</div>
                    <textarea
                      className={classes.textInputMassive}
                      placeholder="Enter the message to be broadcasted here."
                      onChange={(val) => {
                        this.setState({
                          message_text: val.target.value,
                          foundSomeFormError: false,
                        });
                      }}
                      value={this.state.message_text}
                      maxLength={this.state.maxMessageLimit}
                    ></textarea>
                    <div
                      style={{
                        fontSize: 13,
                        marginBottom: 50,
                        width: 400,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <MdCreate
                        style={{
                          position: "relative",
                          bottom: 1,
                          marginRight: 2,
                        }}
                      />
                      <span>
                        {this.state.maxMessageLimit -
                          this.state.message_text.length}
                      </span>
                    </div>
                  </div>

                  {/* Allow push notifications */}
                  <div className={classes.pusNotificationsAllowing}>
                    <Checkbox
                      defaultChecked
                      style={{ padding: 0 }}
                      value={this.state.shouldNotifyBy_pushNotif}
                      onChange={(val) => {
                        this.setState({
                          shouldNotifyBy_pushNotif: val.target.checked,
                          foundSomeFormError: false,
                        });
                      }}
                    />
                    Notify the recipient by push notification (recommended)
                  </div>

                  {/* Done */}
                  <div className={classes.submitContainer}>
                    <div className={classes.errorMessagePart}>
                      {this.state.foundSomeFormError ? (
                        <>
                          <MdRemoveCircle
                            style={{
                              position: "relative",
                              marginRight: 2,
                              width: 25,
                              height: 25,
                            }}
                          />
                          <span>{this.state.errorForm_text}</span>
                        </>
                      ) : null}
                    </div>
                    <div
                      className={classes.basicInputStyleSubmit}
                      onClick={() => this.sendBroadcastedMessage()}
                    >
                      <MdCallSplit /> Send
                    </div>
                  </div>
                </div>
              </div>
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
      UpdateSuccessfullLoginDetails,
      UpdateOverviewData,
      UpdateGlobalOverviewData,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Broadcasting);
