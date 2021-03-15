import React from 'react';
import ReactDOM from 'react-dom';
import "./components/overview/overview.css"
import "react-datepicker/dist/react-datepicker.css"
import App from './App';
//import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom"
import { Auth0Provider } from '@auth0/auth0-react'

const domain = process.env.REACT_APP_AUTH0_DOMAIN
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID


ReactDOM.render(
 
    <BrowserRouter>
      <App />
    </BrowserRouter>
 ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
/*<Auth0Provider
domain={domain}
  clientId={clientId}
  redirectUri={window.location.origin}>
 </Auth0Provider>  */