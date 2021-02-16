import React from 'react'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"
import PartnersAdmin from "./components/partners/partnersAdmin"

function App() {
  return (
    <Router>
      <Switch>
       
        <Route path="/partnerAdmin" component={PartnersAdmin} />
        
      </Switch>
      
    </Router>
  );
}

export default App;
