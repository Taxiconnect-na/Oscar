import React, { useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { UpdateSuccessfullLoginDetails } from "./Redux/HomeActionsCreators";
//Import components
import Sidebar from "./components/sidebar/sidebar";
import Overview from "./components/overview/overview";
import Login from "./components/Login/Login";
import DriverRegistration from "./components/driverRegistration/driverRegistration";
import RideOverview from "./components/rideOverview/rideOverview";
import DeliveryOverview from "./components/deliveryOverview/deliveryOverview";
import DriverList from "./components/driversList/driverList";
import PassengerList from "./components/passengersList/passengerList";
import CashPaymentDriver from "./components/cashPaymentDriver/cashPaymentDriver";
import Loader from "./components/Loader/Loader";
import ErrorPage from "./components/errorPage/ErrorPage";
import SuccessPage from "./components/successPage/SuccessPage";
import CancelledRides from "./components/cancelledRides/CancelledRides";
import CancelledRidesDrivers from "./components/cancelledRides/CancelledRidesDrivers";
import Graph from "./components/Graphs/Graph";
import RideCounts from "./components/visualize/RideCounts";
import DataVisualizerRoutesList from "./components/DataVisualizerRoutesList/DataVisualizerRoutesList";
//import LoginButton from "./components/LoginButton"
//import LogoutButton from "./components/LogoutButton"
//import Profile from "./components/Profile"
import "./App.css";
import { VscLoading } from "react-icons/vsc";
import CancelledDeliveries from "./components/cancelledRides/CancelledDeliveries";
import GrossSales from "./components/visualize/GrossSales";
import Revenues from "./components/visualize/Revenues";
import ConnectTypes from "./components/visualize/ConnectTypes";
import PaymentMethods from "./components/visualize/PaymentMethods";
import MonthlyDataDetailed from "./components/visualize/MonthlyDataDetailed";
import DriverDataUpdate from "./components/driverRegistration/driverDataUpdate";
import DriverCommission from "./components/driverCommission/driverCommission";
import driverCommissionDetailed from "./components/driverCommission/driverCommissionDetailed";
import Referrals from "./components/referrals/Referrals";
import DriverRegistrationReferred from "./components/driverRegistration/driverRegistrationReferred";
import Header from "./components/Header/Header";
import NotPermitted from "./components/errorPage/NotPermitted";
import Broadcasting from "./components/Broadcasting/Broadcasting";
import Pricing from "./components/Pricing/Pricing";
import PricesMissing from "./components/Pricing/PricesMissing";

/**
 * @function App : Main function
 * @returns: All routes
 */

class Home extends React.PureComponent {
  constructor(props) {
    super(props);

    // this.props.App.loginData.isLoggedIn = true; //! DEBUG
    this.shouldBeRenderedBasedOnAccess();
  }

  componentDidMount() {
    this.shouldBeRenderedBasedOnAccess();
  }

  componentDidUpdate() {
    this.shouldBeRenderedBasedOnAccess();
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
    return !(
      this.props.App.loginData.admin_data === null ||
      this.props.App.loginData.admin_data === undefined ||
      this.props.App.loginData.admin_data.admin_fp === null ||
      this.props.App.loginData.admin_data.admin_fp === undefined ||
      this.props.App.loginData.admin_data.isSuspended === true ||
      this.props.App.loginData.admin_data.isSuspended === undefined ||
      this.props.App.loginData.admin_data.isSuspended === null
    );
  }

  render() {
    return (
      <div
        style={{
          backgroundColor: "#f3f3f3",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100vh",
        }}
      >
        {this.shouldBeRendered() ? <Header /> : null}

        <div className="mainParentNode">
          {this.shouldBeRendered() ? (
            <div className="sidebar">
              <Sidebar />
            </div>
          ) : null}
          <div className="globalDisplayContent">
            <Switch>
              <Route path="/" exact component={Login} />
              <Route path="/overview" component={Overview} />
              <Route
                path="/driver-registration"
                component={DriverRegistration}
              />
              <Route
                path="/driver-registration-from-referral"
                component={DriverRegistrationReferred}
              />
              <Route path="/trip-overview/rides" component={RideOverview} />
              <Route
                path="/trip-overview/deliveries"
                component={DeliveryOverview}
              />
              <Route path="/drivers" component={DriverList} />
              <Route path="/cancelledRidesRiders" component={CancelledRides} />
              <Route
                path="/cancelled-rides-ByDrivers"
                component={CancelledRidesDrivers}
              />
              <Route
                path="/cancelled-deliveries"
                component={CancelledDeliveries}
              />
              <Route path="/drivers-update" component={DriverDataUpdate} />

              <Route path="/passengers" component={PassengerList} />

              <Route path="/driver-payment" component={CashPaymentDriver} />
              <Route path="/loadertest" component={Loader} />
              <Route path="/action/success" component={SuccessPage} />
              <Route path="/action/error" component={ErrorPage} />

              <Route path="/graph" component={Graph} />

              <Route path="/visualize" component={DataVisualizerRoutesList} />
              <Route path="/visualize-ride-counts" component={RideCounts} />
              <Route path="/visualize-gross-sales" component={GrossSales} />
              <Route path="/visualize-revenues" component={Revenues} />
              <Route path="/visualize-connect-types" component={ConnectTypes} />
              <Route
                path="/visualize-payment-methods"
                component={PaymentMethods}
              />
              <Route
                path="/monthly-data-detailed"
                component={MonthlyDataDetailed}
              />

              <Route path="/Commission" component={DriverCommission} />
              <Route
                path="/CommissionDetailed"
                component={driverCommissionDetailed}
              />
              <Route path="/Broadcasting" component={Broadcasting} />

              <Route path="/Pricing" component={Pricing} />
              <Route path="/Prices_unfound" component={PricesMissing} />

              {/* REFERRALS PATH  */}
              <Route path="/referrals" component={Referrals} />

              {/* Access not permited */}
              <Route path="/access_restricted" component={NotPermitted} />
            </Switch>
          </div>
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
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Home);
