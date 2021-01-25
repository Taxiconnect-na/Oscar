import React from 'react'
import { BrowserRouter as Router, Route } from "react-router-dom"

//Import components
import Overview from "./components/overview/overview"
import DriverRegistration from "./components/driverRegistration/driverRegistration"

function App() {
  return (
   <Router>
     <Route path="/summary" exact component={Overview} />
     <Route path="/driver-registration" component={DriverRegistration} />
   </Router>

  );
}

export default App;
