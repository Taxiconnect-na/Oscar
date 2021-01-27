import React from 'react'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

//Import components
import Overview from "./components/overview/overview"
import DriverRegistration from "./components/driverRegistration/driverRegistration"
import RideOverview from "./components/rideOverview/rideOverview"

function App() {
  return (
   <Router>
     
        <Route path="/" exact component={Overview} />
        <Route path="/driver-registration"  component={DriverRegistration} />
        <Route path= "/ride-overview" component={RideOverview} />
   </Router>

  );
}

export default App;
