import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { BrowserRouter as Router, Link } from "react-router-dom"; // Keep Router though not used in code
import "react-pro-sidebar/dist/css/styles.css";
import "./sidebar.scss";
import logotaxiconnect from "../../logo_white.png";
import React, { useState } from "react";
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

function Sidebar() {
  let [over, setOver] = useState(false);
  const iconStyle = {
    width: 35,
    height: 20,
    position: "relative",
    bottom: "2px",
    color: "#fff",
  };

  return (
    <ProSidebar>
      <Menu iconShape="square">
        <div className="logoContainer">
          <img src={logotaxiconnect} alt="TaxiConnect" className="logoTrue" />
        </div>
        <MenuItem className="menuItemSideBar">
          <Link to="/">
            <AiFillAppstore style={iconStyle} />
            <span className="menuText">Summary</span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link to="/driver-registration">
            <ImUserPlus style={iconStyle} />
            <span className="menuText">Register Driver</span>
          </Link>
        </MenuItem>

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
            <MenuItem>
              <Link to="/trip-overview/rides">
                <span className="menuText">Rides</span>
              </Link>
            </MenuItem>
            <MenuItem>
              <Link to="/trip-overview/deliveries">
                <span className="menuText">Deliveries</span>
              </Link>
            </MenuItem>
          </SubMenu>
          <SubMenu title="Swakopmund">
            <MenuItem className="menuText">Not Available</MenuItem>
          </SubMenu>
        </SubMenu>
        <SubMenu
          className="menuText menuItemSideBar"
          title={
            <>
              <ImBlocked style={iconStyle} />
              Cancelled trips
            </>
          }
        >
          <MenuItem>
            <Link to="/cancelled-rides-ByPassengers">
              <span className="menuText">Riders</span>
            </Link>
          </MenuItem>
          <MenuItem>
            <Link to="/cancelled-rides-ByDrivers">
              <span className="menuText">Drivers</span>
            </Link>
          </MenuItem>
          <MenuItem>
            <Link to="/cancelled-deliveries">
              <span className="menuText">Deliveries</span>
            </Link>
          </MenuItem>
        </SubMenu>
        <MenuItem className="menuItemSideBar">
          <Link to="/drivers">
            <ImUserCheck style={iconStyle} />
            <span className="menuText">Drivers</span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link className="menuText" to="/passengers">
            <ImUsers style={iconStyle} />
            <span className="menuText">Users </span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link className="menuText" to="/driver-payment">
            <ImPower style={iconStyle} />
            <span className="menuText">Make payment </span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link className="menuText" to="/visualize">
            <AiFillSignal style={iconStyle} />
            <span className="menuText">Visualize </span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link className="menuText" to="/driver-commission">
            <ImPieChart style={iconStyle} />
            <span className="menuText">Commissions</span>
          </Link>
        </MenuItem>
        <MenuItem className="menuItemSideBar">
          <Link className="menuText" to="/referrals">
            <ImShare2 style={iconStyle} />
            <span className="menuText">Referrals</span>
          </Link>
        </MenuItem>
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

export default Sidebar;
