import React from 'react'
import { BrowserRouter as Router, Route } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
//Import components
import Overview from "./components/overview/overview"

function App() {
  return (
   <Router>
     <Route path="/summary" exact component={Overview} />
   </Router>

  );
}

export default App;
