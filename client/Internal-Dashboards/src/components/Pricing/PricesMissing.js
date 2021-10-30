import React, { Component } from "react";
import classes from "./Pricing.module.css";
import { AiTwotoneCheckSquare, AiTwotoneCompass } from "react-icons/ai";
import { MdLock, MdLockOpen } from "react-icons/md";
import Loader from "react-loader-spinner";
import SOCKET_CORE from "../socket";

class PricesMissing extends Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      pricesArrayData: {},
      distributedStates: [],
      selectedTown: "Windhoek",
    };
  }

  componentDidMount() {
    let globalObject = this;

    this.getPricingData();

    //HANDLE SOCKET IO RESPONSES
    this.SOCKET_CORE.on(
      "handlePricingRecords_io-response",
      function (response) {
        if (
          response !== undefined &&
          response.response !== undefined &&
          response.response.length > 0 &&
          /empty_records/i.test(response.response) === false
        ) {
          if (
            `${JSON.stringify(response)}` !==
            `${JSON.stringify(globalObject.state.pricesArrayData.stateHash)}`
          ) {
            globalObject.setState({ pricesArrayData: response });
          }
        } //No data or error
        else {
          if (
            Object.keys(globalObject.state.pricesArrayData).length > 0 &&
            globalObject.state.pricesArrayData.response.length !== 0
          ) {
            globalObject.setState({ pricesArrayData: {} });
          }
        }
      }
    );

    //Modify live records
    this.SOCKET_CORE.on(
      "handlePricingRecords_io_modifyRecord-response",
      function (response) {
        if (
          response !== undefined &&
          response.response !== undefined &&
          /error/i.test(response.response) === false
        ) {
          setTimeout(function () {
            globalObject.setState({
              pricesArrayData: {},
              distributedStates: [],
            });
          }, 2000);
        } //No data or error
        else {
          alert(
            "We were unable to modify the records due to some unexpected errors, please try again later."
          );
        }
      }
    );
  }

  getPricingData() {
    let globalObject = this;

    this.intervalPersister = setInterval(function () {
      globalObject.SOCKET_CORE.emit("handlePricingRecords_io", {
        region: globalObject.state.selectedTown,
        action: "get",
        recordType: "missing",
      });
    }, 3000);
  }

  renderPricesList() {
    if (
      Object.keys(this.state.pricesArrayData).length > 0 &&
      this.state.pricesArrayData.response !== undefined &&
      this.state.pricesArrayData.response.length > 0
    ) {
      //   this.state.distributedStates = [];
      //...
      return this.state.pricesArrayData.response.map((element, index) => {
        let stateTemplate = {
          index: index,
          isLoading: false,
          isLocked: true,
          original_fare: parseInt(element.fare),
          edited_fare: null,
        };
        //...
        if (
          this.state.distributedStates[index] === undefined ||
          this.state.distributedStates[index] === null
        ) {
          this.state.distributedStates.push(stateTemplate);
        }
        //...
        return (
          <div key={index} style={{ display: "flex", flexDirection: "row" }}>
            <div className={classes.indexNo}>{index + 1}</div>
            <div className={classes.pricesNode}>
              <div className={classes.detailsNode}>
                <div className={classes.locationTypical}>
                  <div className={classes.labelLocation}>
                    <AiTwotoneCompass style={{ width: 7, height: 7 }} /> Pickup
                  </div>
                  <div className={classes.subTextName}>
                    {element.pickup_suburb}
                  </div>
                </div>
                <div className={classes.locationTypical}>
                  <div className={classes.labelLocation}>
                    <AiTwotoneCheckSquare style={{ width: 7, height: 7 }} />{" "}
                    Dropoff
                  </div>
                  <div className={classes.subTextName}>
                    {element.destination_suburb}
                  </div>
                </div>
                {/* city */}
                <div className={classes.priceDetails}>
                  <div className={classes.locationTypical}>
                    <div
                      className={classes.labelLocation}
                      style={{ color: "#000" }}
                    >
                      <AiTwotoneCheckSquare style={{ width: 7, height: 7 }} />{" "}
                      City
                    </div>
                    <div
                      className={classes.subTextName}
                      style={{ fontSize: 12 }}
                    >
                      {element.city}
                    </div>
                  </div>
                  {/* country */}
                  <div className={classes.locationTypical}>
                    <div
                      className={classes.labelLocation}
                      style={{ color: "#000" }}
                    >
                      <AiTwotoneCheckSquare style={{ width: 7, height: 7 }} />{" "}
                      Country
                    </div>
                    <div
                      className={classes.subTextName}
                      style={{ fontSize: 12 }}
                    >
                      {element.country}
                    </div>
                  </div>
                  {/* date */}
                  <div className={classes.locationTypical}>
                    <div
                      className={classes.labelLocation}
                      style={{ color: "#000" }}
                    >
                      <AiTwotoneCheckSquare style={{ width: 7, height: 7 }} />{" "}
                      Date recorded
                    </div>
                    <div
                      className={classes.subTextName}
                      style={{ fontSize: 12 }}
                    >
                      {new Date(element.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className={classes.actionsNode}>
                <div className={classes.inputContainerParent}>
                  <input
                    type="number"
                    placeholder="fare"
                    className={classes.fareInput}
                    disabled={this.state.distributedStates[index].isLocked}
                    value={
                      this.state.distributedStates[index].edited_fare === null
                        ? this.state.distributedStates[index].original_fare
                        : this.state.distributedStates[index].edited_fare
                    }
                    onChange={(val) => {
                      let stateArray = this.state.distributedStates;
                      stateArray[index].edited_fare = parseInt(
                        val.target.value
                      );
                      //! Limit to 1000
                      stateArray[index].edited_fare =
                        stateArray[index].edited_fare > 1000
                          ? stateArray[index].original_fare
                          : stateArray[index].edited_fare;
                      //...
                      this.setState({ distributedStates: stateArray });
                    }}
                  />
                  <button
                    className={classes.unlockFareButton}
                    onClick={() => {
                      let stateArray = this.state.distributedStates;
                      stateArray[index].isLocked = stateArray[index].isLocked
                        ? false
                        : true;
                      //...
                      this.setState({ distributedStates: stateArray });
                    }}
                  >
                    {this.state.distributedStates[index].isLocked ? (
                      <MdLock />
                    ) : (
                      <MdLockOpen />
                    )}
                  </button>
                </div>
                <div className={classes.noticeEdit}>
                  {this.state.distributedStates[index].isLocked
                    ? "To edit unlock then edit the price."
                    : "You can edit the fare."}
                </div>
                <br />
                {this.state.distributedStates[index].isLoading === false ? (
                  <div className={classes.buttonsContainer}>
                    {this.state.distributedStates[index].original_fare !==
                      this.state.distributedStates[index].edited_fare &&
                    this.state.distributedStates[index].edited_fare !== null ? (
                      <div
                        className={classes.buttonGeneric}
                        onClick={
                          this.state.distributedStates[index].isLocked === false
                            ? () => {
                                let stateArray = this.state.distributedStates;
                                stateArray[index].isLoading = true;
                                //? Do the rest
                                this.SOCKET_CORE.emit(
                                  "handlePricingRecords_io",
                                  {
                                    action: "set",
                                    recordType: "missing",
                                    pricingData: {
                                      pickup_suburb: element.pickup_suburb,
                                      destination_suburb:
                                        element.destination_suburb,
                                      city: element.city,
                                      country: element.country,
                                      region: element.region,
                                      fare: this.state.distributedStates[
                                        index
                                      ].edited_fare.toString(),
                                    },
                                  }
                                );
                                //...
                                this.setState({
                                  distributedStates: stateArray,
                                });
                              }
                            : () => alert("block confirmation")
                        }
                      >
                        Confirm
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {/* Delete */}
                    {this.state.distributedStates[index].isLoading === false ? (
                      <div>
                        <div
                          className={classes.deletePrice}
                          onClick={
                            this.state.distributedStates[index].isLocked ===
                            false
                              ? () => {
                                  let stateArray = this.state.distributedStates;
                                  stateArray[index].isLoading = true;
                                  //? Do the rest
                                  this.SOCKET_CORE.emit(
                                    "handlePricingRecords_io",
                                    {
                                      action: "delete",
                                      pricingData: {
                                        pickup_suburb: element.pickup_suburb,
                                        destination_suburb:
                                          element.destination_suburb,
                                        city: element.city,
                                        country: element.country,
                                      },
                                    }
                                  );
                                  //...
                                  this.setState({
                                    distributedStates: stateArray,
                                  });
                                }
                              : () => alert("block deletion")
                          }
                        >
                          Delete
                        </div>
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Loader
                      type="TailSpin"
                      color="#000"
                      height={15}
                      width={15}
                      timeout={300000000} //3 secs
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      });
    } else {
      return <div>No prices</div>;
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
        {" "}
        <div className={classes.headerGeneric}>
          <div>
            <div>Prices directory</div>
            <div style={{ fontFamily: "MoveTextRegular", fontSize: 14 }}>
              {Object.keys(this.state.pricesArrayData).length === 0
                ? 0
                : this.state.pricesArrayData.response.length}{" "}
              records
            </div>
          </div>
          <div className={classes.dayZoomLabel}>
            <select
              value={this.state.selectedTown}
              onChange={(val) => {
                this.setState({
                  selectedTown: val.target.value,
                  pricesArrayData: {},
                  distributedStates: [],
                });
              }}
            >
              <option value="Windhoek">Windhoek</option>
              <option value="Swakopmund">Swakopmund</option>
              <option value="Walvis Bay">Walvis Bay</option>
            </select>
          </div>
        </div>
        <div>
          {/* Prices node */}
          {this.renderPricesList()}
        </div>
      </div>
    );
  }
}

export default PricesMissing;
