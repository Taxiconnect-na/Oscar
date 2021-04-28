import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"

//Import components
import Sidebar from "./components/sidebar/sidebar"
import Overview from "./components/overview/overview"
import DriverRegistration from "./components/driverRegistration/driverRegistration"
import RideOverview from "./components/rideOverview/rideOverview"
import DeliveryOverview from "./components/deliveryOverview/deliveryOverview"
import DriverList from "./components/driversList/driverList"
import PassengerList from "./components/passengersList/passengerList"
import CashPaymentDriver from './components/cashPaymentDriver/cashPaymentDriver'
import socket from "./components/socket"
import Loader from "./components/Loader/Loader"
import ErrorPage from "./components/errorPage/ErrorPage"
import SuccessPage from "./components/successPage/SuccessPage"
import CancelledRides from "./components/cancelledRides/CancelledRides"
import Graph from "./components/Graphs/Graph"
//import LoginButton from "./components/LoginButton"
//import LogoutButton from "./components/LogoutButton"
//import Profile from "./components/Profile"
import "./App.css"
import logotaxiconnect from "./logotaxiconnect.png"
import { VscLoading } from "react-icons/vsc"



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

function App() {

   //Initialize state variables
   let [name, setName] = useState(null)
   let [email, setEmail] = useState(null)
   let [password, setPassword] = useState(null)
  //! Authentication variable
   // Use LocalStorage to preserve authentication state
  /*let [authenticated, setAuthentication] = useLocalStorage(
    "authenticated",
    false
  )*/
  let [authenticated, setAuthentication] = useState(true)




  // Loading state variable
  let [loading, setLoading] = useState(false)

  const [details, setDetails] = useLocalStorage("details", {
    name: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")


  const submitHandler = (e) => {
    e.preventDefault();
    // Set loading variable true
    setLoading(true)
    //Authenticate user:
    socket.emit("authenticate-internal-admin", {
      name: details.name,
      email: details.email,
      password: details.password,
    });

    socket.on("authenticate-internal-admin-response", (data) => {
      if (data.authenticated) {
        //  Upon successful authentication:
        setAuthentication(true);
        setName(details.name);
        setEmail(details.email);
        setPassword(details.password);
        // Set loading variable true
        setLoading(false)

      } else {
        setError("No match found");
        // Set loading variable true
        setLoading(false)
      }
    });
  };

  const Logout = () => {
    setAuthentication(false);
    setError("");
    setDetails({ name: "", email: "", password: "" });

  };

  // styles:
  const form_style = {
    width: "50%",
    margin: "auto",
    padding: "3%"
  };
  const topTextStyle = {
    fontFamily: "UberMoveTextMedium",
    fontSize: 14,
  };
  const loginFieldStyle = {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    paddingLeft: 0,
    fontSize: 18,
    outlineWidth: 0,
    marginBottom: "7%",
    fontFamily: "UberMoveTextRegular",
    paddingBottom: 10,
  };


  // ---------------------------------------------------
  
  /*if (isLoading) return <div style={loadingStyle}> Authenticating...</div>

  // If not authenticated, return the login page/button
  /*
  return !isAuthenticated ?
  (
    <div>
      <LoginButton />
    </div>
  ) : allowed.includes("john")?
   ( <>
     <div style= {{ float: "right"}}>
      <LogoutButton />
      <Profile />
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

  ) : <div> Hallo  hallo</div> */
  // Returned content:
  if (!authenticated) {
    // render the loader if waiting for authentication response
    if(loading) {

      return(

        <div className="uploading">
                    
        <VscLoading style={{width: 120, height: 120, marginTop:"5%", backgroundColor:"#16a0db"}} className="rotate"/>
        <img src={logotaxiconnect} alt="Loading..." style={{ width: "15%"}} />
        
        </div>
      )
    }

    return (
      <div style={{ width: "100%"}}>
        <div className="my-form">
          <form onSubmit={submitHandler} style={form_style}>
            <div className="form-inner">
             
              <h2
                style={{
                  marginLeft: "19%",
                  fontFamily: "MoveMedium",
                  marginBottom: "10%",
                  paddingBottom: "3%"
                }}
              >
                TaxiConnect Administration
              </h2>
              {error !== "" ? (
                <div
                  className="text-warning"
                  style={{ width: 200, margin: "auto" }}
                >
                  {error}
                </div>
              ) : (
                ""
              )}
              <div className="form-group">
                <label htmlFor="name" style={topTextStyle}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="form-control"
                  placeholder="What's your name ?"
                  style={loginFieldStyle}
                  onChange={(e) =>
                    setDetails({ ...details, name: e.target.value })
                  }
                  value={details.name}
                ></input>
              </div>
              <div className="form-group">
                <label htmlFor="email" style={topTextStyle}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="What about your email ?"
                  className="form-control"
                  style={loginFieldStyle}
                  onChange={(e) =>
                    setDetails({ ...details, email: e.target.value })
                  }
                  value={details.email}
                ></input>
              </div>
              <div className="form-group">
                <label htmlFor="password" style={topTextStyle}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="And the password"
                  className="form-control"
                  style={loginFieldStyle}
                  onChange={(e) =>
                    setDetails({ ...details, password: e.target.value })
                  }
                  value={details.password}
                ></input>
              </div>
              <input
                className="form-control"
                id="submit-button"
                type="submit"
                value="Next"
                style={{
                  marginTop: "15%",
                  backgroundColor: "#000",
                  fontFamily: "MoveMedium",
                  color: "#fff",
                  fontSize: 20,
                  borderColor: "#000",
                  padding: 13,
                  borderRadius: 2,
                }}
              />
            </div>
          </form>
        </div>
      </div>
    );
  } else if (authenticated) {
    return (
      <>
        <div >
          
          <div>
            <div style= {{float:"none", height:"1%", marginTop: "2px",backgroundColor: "#03162e"}}>
              <button className="btn btn-primary btn-sm" type="submit" onClick={Logout} style={{ fontFamily: "MoveMedium", fontSize: 15, height:"29px" }}>
                        Logout
              </button>
            </div>

            <Router>
              <Switch>
                <Route path="/" exact component={Overview} />
                <Route path="/driver-registration"  component={DriverRegistration} />
                <Route path= "/trip-overview/rides" component={RideOverview} />
                <Route path ="/trip-overview/deliveries" component={DeliveryOverview} />
                <Route path="/drivers" component={DriverList} />
                {/*<Route path="/passengers" component={PassengerList} /> */}
                <Route path="/driver-payment" component={CashPaymentDriver} />
                <Route path="/loadertest" component={Loader} />
                <Route path="/action/success" component={SuccessPage} />
                <Route path="/action/error" component={ErrorPage} />
                <Route path="/cancelled-rides" component={CancelledRides} />
                <Route path="/graph" component={Graph} />
                
              </Switch>
            </Router>
          </div>
        </div>
        
    </>
    )
  }
}

export default App;

