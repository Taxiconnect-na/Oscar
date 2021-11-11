import React from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { BrowserRouter as Router, Link, Redirect } from "react-router-dom"; // Ke
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  UpdateSuccessfullLoginDetails,
  UpdateLatestAccessPatternsAndSuspInfos,
  UpdateSelectedRegionForViewing,
  LogOut,
} from "../../Redux/HomeActionsCreators";
import SOCKET_CORE from "../socket";
import "react-pro-sidebar/dist/css/styles.css";
import "./sidebar.scss";
import {
  AiFillAppstore,
  AiFillSignal,
  AiFillInfoCircle,
  AiOutlineLogout,
} from "react-icons/ai";
import {
  ImUserPlus,
  ImMap,
  ImBlocked,
  ImUserCheck,
  ImUsers,
  ImPower,
  ImEarth,
  ImPieChart,
  ImShare2,
} from "react-icons/im";
import { MdChatBubble, MdAccountBalance } from "react-icons/md";
import { icons } from "react-icons/lib";

const iconStyle = {
  width: 30,
  height: 15,
  position: "relative",
  bottom: "1px",
  color: "#4b5158",
};

class Sidebar extends React.PureComponent {
  constructor(props) {
    super(props);

    this.intervalPersister = null;

    this.shouldBeRenderedBasedOnAccess();
  }

  componentDidUpdate() {
    this.shouldBeRenderedBasedOnAccess();
  }

  componentDidMount() {
    this.shouldBeRenderedBasedOnAccess();
    let globalObject = this;

    this.props.App.SOCKET_CORE =
      this.props.App.SOCKET_CORE.on === undefined ||
      this.props.App.SOCKET_CORE.on === null
        ? SOCKET_CORE
        : this.props.App.SOCKET_CORE;

    this.getAccessPatternsSuspensionStats();

    //Handle socket io events
    this.props.App.SOCKET_CORE.on(
      "getLastesAccessAndSuspensionIfo-response",
      function (response) {
        if (
          response !== undefined &&
          response !== null &&
          response.response !== undefined &&
          response.response !== null &&
          response.response.admin_fp !== undefined &&
          response.response.admin_fp !== null
        ) {
          // console.log(response);
          globalObject.props.UpdateLatestAccessPatternsAndSuspInfos(
            response.response
          );
        }
      }
    );
  }

  /**
   * Responsible to answer to yes or no question of which component should be rendered
   * @return true: Yes render
   * @return false: No do not render
   */
  shouldBeRenderedBasedOnAccess() {
    if (
      (this.props.App.loginData.admin_data === null ||
        this.props.App.loginData.admin_data === undefined ||
        this.props.App.loginData.admin_data.admin_fp === null ||
        this.props.App.loginData.admin_data.admin_fp === undefined ||
        this.props.App.loginData.admin_data.isSuspended === true ||
        this.props.App.loginData.admin_data.isSuspended === undefined ||
        this.props.App.loginData.admin_data.isSuspended === null) &&
      /\/$/.test(window.location.href) === false
    ) {
      this.props.LogOut();
      window.location.href = "/";
    }
  }
  //!Part B
  shouldBeRendered() {
    return (
      this.props.App.loginData.admin_data === null ||
      this.props.App.loginData.admin_data === undefined ||
      this.props.App.loginData.admin_data.admin_fp === null ||
      this.props.App.loginData.admin_data.admin_fp === undefined ||
      this.props.App.loginData.admin_data.isSuspended === true ||
      this.props.App.loginData.admin_data.isSuspended === undefined ||
      this.props.App.loginData.admin_data.isSuspended === null
    );
  }

  /**
   *  Responsible for getting periodically the access patterns for the current user if any and suspension status.
   */
  getAccessPatternsSuspensionStats() {
    let globalObject = this;

    if (this.props.App.loginData.admin_data !== null) {
      try {
        this.intervalPersister = setInterval(function () {
          globalObject.props.App.SOCKET_CORE.emit(
            "getLastesAccessAndSuspensionIfo",
            {
              admin_fp:
                globalObject.props.App.loginData.admin_data !== null
                  ? globalObject.props.App.loginData.admin_data.admin_fp
                  : 0,
            }
          );
        }, 2000);
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
      <ProSidebar>
        <Menu iconShape="square">
          <div className="logoContainer" style={{ color: "#4b5158" }}>
            Administration
          </div>
          {this.props.App.loginData.admin_data !== null &&
          /overviewSummary/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link to="/">
                <AiFillAppstore style={iconStyle} />
                <span className="menuText">Summary</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}
          {this.props.App.loginData.admin_data !== null &&
          /registerDrivers/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link to="/driver-registration">
                <ImUserPlus style={iconStyle} />
                <span className="menuText">Register Driver</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /tripOverview/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <SubMenu
              className="menuText menuItemSideBar"
              title={
                <>
                  <ImEarth style={iconStyle} />
                  Trip Overview
                </>
              }
            >
              <SubMenu title="Khomas">
                {this.props.App.loginData.admin_data !== null &&
                /ridesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link
                      onClick={() => {
                        let region = "Khomas";
                        this.props.App.selectedRegion = region;
                        this.props.UpdateSelectedRegionForViewing(region);
                        window.location.href = "/trip-overview/rides";
                      }}
                    >
                      <span className="menuText">Rides</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
                {this.props.App.loginData.admin_data !== null &&
                /deliveriesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link
                      onClick={() => {
                        let region = "Khomas";
                        this.props.App.selectedRegion = region;
                        this.props.UpdateSelectedRegionForViewing(region);
                        window.location.href = "/trip-overview/deliveries";
                      }}
                    >
                      <span className="menuText">Deliveries</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
              </SubMenu>
              <SubMenu title="Erongo">
                {this.props.App.loginData.admin_data !== null &&
                /ridesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link
                      onClick={() => {
                        let region = "Erongo";
                        this.props.App.selectedRegion = region;
                        this.props.UpdateSelectedRegionForViewing(region);
                        window.location.href = "/trip-overview/rides";
                      }}
                    >
                      <span className="menuText">Rides</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
                {this.props.App.loginData.admin_data !== null &&
                /deliveriesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link
                      onClick={() => {
                        let region = "Erongo";
                        this.props.App.selectedRegion = region;
                        this.props.UpdateSelectedRegionForViewing(region);
                        window.location.href = "/trip-overview/deliveries";
                      }}
                    >
                      <span className="menuText">Deliveries</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
              </SubMenu>
            </SubMenu>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /cancelledTrips/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <SubMenu
              className="menuText menuItemSideBar"
              title={
                <>
                  <ImBlocked style={iconStyle} />
                  Cancelled trips
                </>
              }
            >
              {this.props.App.loginData.admin_data !== null &&
              /ridersCancelledRides/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link to="/cancelledRidesRiders">
                    <span className="menuText">Riders</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
              {this.props.App.loginData.admin_data !== null &&
              /driversCancelledRides/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link to="/cancelled-rides-ByDrivers">
                    <span className="menuText">Drivers</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
              {this.props.App.loginData.admin_data !== null &&
              /cancelledDeliveries/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link to="/cancelled-deliveries">
                    <span className="menuText">Deliveries</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
            </SubMenu>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /viewDrivers/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link to="/drivers">
                <ImUserCheck style={iconStyle} />
                <span className="menuText">Drivers</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /viewUsers/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/passengers">
                <ImUsers style={iconStyle} />
                <span className="menuText">Users </span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /broadcasting/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/Broadcasting">
                <MdChatBubble style={iconStyle} />
                <span className="menuText">Broadcasting</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /statistics/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/visualize">
                <AiFillSignal style={iconStyle} />
                <span className="menuText">Statistics</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /driversComissionCentral/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/Commission">
                <ImPieChart style={iconStyle} />
                <span className="menuText">Commissions</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /pricingSettings/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <SubMenu
              className="menuText menuItemSideBar"
              title={
                <>
                  <MdAccountBalance style={iconStyle} />
                  Pricing
                </>
              }
            >
              {this.props.App.loginData.admin_data !== null &&
              /pricingSettingsDirectory/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link
                    onClick={() => {
                      window.location.href = "/Pricing";
                    }}
                  >
                    <span className="menuText">Prices directory</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
              {this.props.App.loginData.admin_data !== null &&
              /pricingSettingsMissing/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link
                    onClick={() => {
                      window.location.href = "/Prices_unfound";
                    }}
                  >
                    <span className="menuText">Missing prices</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
            </SubMenu>
          ) : (
            <></>
          )}

          {this.props.App.loginData.admin_data !== null &&
          /referralsView/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/referrals">
                <ImShare2 style={iconStyle} />
                <span className="menuText">Referrals</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          <MenuItem className="menuItemSideBar">
            <Link
              onClick={() => {
                this.props.LogOut();
                window.location.href = "/";
              }}
            >
              <AiOutlineLogout style={iconStyle} />
              <span className="menuText">Log out</span>
            </Link>
          </MenuItem>

          <MenuItem className="menuTextVersionNo">
            <Link>
              <AiFillInfoCircle
                style={{
                  width: 30,
                  height: 15,
                  position: "relative",
                  bottom: "1px",
                  color: /Development/i.test(
                    String(process.env.REACT_APP_ENVIRONMENT)
                  )
                    ? "red"
                    : "#4b5158",
                }}
              />
              <span className="menuTextVersionNo">v2.0.082</span>
            </Link>
          </MenuItem>
        </Menu>
      </ProSidebar>
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
      UpdateLatestAccessPatternsAndSuspInfos,
      UpdateSelectedRegionForViewing,
      LogOut,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
