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
import socket from "./components/socket";
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
import logotaxiconnect from "./logotaxiconnect.png";
import { VscLoading } from "react-icons/vsc";
import CancelledDeliveries from "./components/cancelledRides/CancelledDeliveries";
import GrossSales from "./components/visualize/GrossSales";
import Revenues from "./components/visualize/Revenues";
import ConnectTypes from "./components/visualize/ConnectTypes";
import PaymentMethods from "./components/visualize/PaymentMethods";
import MonthlyDataDetailed from "./components/visualize/MonthlyDataDetailed";
import DriverDataUpdate from "./components/driverRegistration/driverDataUpdate";
import DriverCommission from "./components/driverCommission/driverCommission";
import DriverCommissionInsert from "./components/driverCommission/driverCommissionInsert";
import Referrals from "./components/referrals/Referrals";
import DriverRegistrationReferred from "./components/driverRegistration/driverRegistrationReferred";

function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
/**
 * @function App : Main function
 * @returns: All routes
 */

class Home extends React.PureComponent {
  constructor(props) {
    super(props);

    // this.props.App.loginData.isLoggedIn = true; //! DEBUG
  }

  componentDidMount() {}

  render() {
    return (
      <div>
        <div className="mainParentNode">
          {this.props.App.loginData.isLoggedIn ? (
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
              <Route
                path="/cancelled-rides-ByPassengers"
                component={CancelledRides}
              />
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

              <Route path="/driver-commission" component={DriverCommission} />
              <Route
                path="/driver-commission-payment"
                component={DriverCommissionInsert}
              />

              {/* REFERRALS PATH  */}
              <Route path="/referrals" component={Referrals} />
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
