import React from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { BrowserRouter as Router, Link } from "react-router-dom"; // Ke
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import {
  UpdateSuccessfullLoginDetails,
  UpdateLatestAccessPatternsAndSuspInfos,
} from "../../Redux/HomeActionsCreators";
import SOCKET_CORE from "../socket";
import "react-pro-sidebar/dist/css/styles.css";
import "./sidebar.scss";
import logotaxiconnect from "../../logo_white.png";
import { AiFillAppstore, AiFillSignal, AiFillInfoCircle } from "react-icons/ai";
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

const iconStyle = {
  width: 35,
  height: 20,
  position: "relative",
  bottom: "2px",
  color: "#fff",
};

class Sidebar extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
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
   *  Responsible for getting periodically the access patterns for the current user if any and suspension status.
   */
  getAccessPatternsSuspensionStats() {
    let globalObject = this;

    setInterval(function () {
      globalObject.props.App.SOCKET_CORE.emit(
        "getLastesAccessAndSuspensionIfo",
        {
          admin_fp: globalObject.props.App.loginData.admin_data.admin_fp,
        }
      );
    }, 2000);
  }

  render() {
    return (
      <ProSidebar>
        <Menu iconShape="square">
          <div className="logoContainer">
            <img src={logotaxiconnect} alt="TaxiConnect" className="logoTrue" />
          </div>
          {/overview/i.test(
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
          {/registerDrivers/i.test(
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

          {/tripOverview/i.test(
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
              <SubMenu title="Windhoek">
                {/ridesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link to="/trip-overview/rides">
                      <span className="menuText">Rides</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
                {/deliveriesTripOverview/i.test(
                  this.props.App.loginData.admin_data.access_patterns
                ) ? (
                  <MenuItem>
                    <Link to="/trip-overview/deliveries">
                      <span className="menuText">Deliveries</span>
                    </Link>
                  </MenuItem>
                ) : (
                  <></>
                )}
              </SubMenu>
              <SubMenu title="Swakopmund">
                <MenuItem className="menuText">Not Available</MenuItem>
              </SubMenu>
            </SubMenu>
          ) : (
            <></>
          )}

          {/cancelledTrips/i.test(
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
              {/ridersCancelledRides/i.test(
                this.props.App.loginData.admin_data.access_patterns
              ) ? (
                <MenuItem>
                  <Link to="/cancelled-rides-ByPassengers">
                    <span className="menuText">Riders</span>
                  </Link>
                </MenuItem>
              ) : (
                <></>
              )}
              {/driversCancelledRides/i.test(
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
              {/cancelledDeliveries/i.test(
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

          {/viewDrivers/i.test(
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

          {/viewUsers/i.test(
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

          {/makePayment/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/driver-payment">
                <ImPower style={iconStyle} />
                <span className="menuText">Make payment </span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {/statistics/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/visualize">
                <AiFillSignal style={iconStyle} />
                <span className="menuText">Visualize </span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {/driversComissionCentral/i.test(
            this.props.App.loginData.admin_data.access_patterns
          ) ? (
            <MenuItem className="menuItemSideBar">
              <Link className="menuText" to="/driver-commission">
                <ImPieChart style={iconStyle} />
                <span className="menuText">Commissions</span>
              </Link>
            </MenuItem>
          ) : (
            <></>
          )}

          {/referralsView/i.test(
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

          <MenuItem className="menuTextVersionNo">
            <Link>
              <AiFillInfoCircle style={iconStyle} />
              <span className="menuTextVersionNo">
                {String(process.env.REACT_APP_ENVIRONMENT)}
              </span>
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
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
