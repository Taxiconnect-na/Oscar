import React from 'react'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

//Import components
import Overview from "./components/overview/overview"
import DriverRegistration from "./components/driverRegistration/driverRegistration"
import RideOverview from "./components/rideOverview/rideOverview"
import DeliveryOverview from "./components/deliveryOverview/deliveryOverview"
import DriverList from "./components/driversList/driverList"
import PassengerList from "./components/passengersList/passengerList"
import CashPaymentDriver from './components/cashPaymentDriver/cashPaymentDriver'
import LoginButton from "./components/LoginButton"
import LogoutButton from "./components/LogoutButton"
import Profile from "./components/Profile"
import { useAuth0 } from "@auth0/auth0-react"

function App() {
  const { isAuthenticated, isLoading } = useAuth0()
  const loadingStyle = {
    fontSize: 30,
    color: "green",
    padding: 10,
    margin: 5
  }

  if (isLoading) return <div style={loadingStyle}> Authenticating...</div>
  // If not authenticated, return the login page/button
  return !isAuthenticated ?
  (
    <div>
      <LoginButton />
    </div>
  ) :
   ( <>
     <div style= {{ float: "right"}}>
      <LogoutButton />
    </div>
   <Router>
      <Switch>
        <Route path="/" exact component={Overview} />
        <Route path="/driver-registration"  component={DriverRegistration} />
        <Route path= "/trip-overview/rides" component={RideOverview} />
        <Route path ="/trip-overview/deliveries" component={DeliveryOverview} />
        <Route path="/drivers" component={DriverList} />
        <Route path="/passengers" component={PassengerList} />
        <Route path="/driver-payment" component={CashPaymentDriver} />
       
      </Switch>
        
   </Router>
   </>

  );
}

export default App;
