import React from 'react'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

//Import components
import Overview from "./components/overview/overview"
import DriverRegistration from "./components/driverRegistration/driverRegistration"
import RideOverview from "./components/rideOverview/rideOverview"
import DeliveryOverview from "./components/deliveryOverview/deliveryOverview"
import DriverList from "./components/driversList/driverList"

function App() {
  return (
   <Router>
     
        <Route path="/" exact component={Overview} />
        <Route path="/driver-registration"  component={DriverRegistration} />
        <Route path= "/trip-overview/rides" component={RideOverview} />
        <Route path ="/trip-overview/deliveries" component={DeliveryOverview} />
        <Route path="/drivers" component={DriverList} />
   </Router>

  );
}

export default App;
