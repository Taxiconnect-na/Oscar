import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { FaUserAlt } from "react-icons/fa"
import "./partnersAdmin.css"
import LoginFormPartner from "./LoginFormPartner"
import queryString from 'query-string'

import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom'

/**
 * @function useLocalStorage: Works like useState except add persistence of data upon reload
 * @param {string} key 
 * @param {any type} initialValue 
 */
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
    const setValue = value => {
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

// Driver row

const DriverRow = (props) => {
    return(
        <tr>
            <td><FaUserAlt size={30}/></td>
            <td>{ props.driver.name}</td>
            <td>{ props.driver.surname }</td>
            <td>{ props.driver.phone_number }</td>
            <td>{ props.driver.taxi_number }</td>
            <td>{ props.driver.plate_number }</td>
            <td>{ props.driver.car_brand }</td>
            <td>{ props.driver.status }</td>
            <td> { props.driver.totalMoneyToday }</td>
            <td>{ props.driver.totalmoney}</td> 
            <td>{ props.driver.todaytrip }</td>
            <td>{ props.driver.totaltrip}</td>
            
        </tr>
    )
}

// Initialize interval
var interval = null

export default function PartnersAdmin() {
    // Initialize socket connection
    var ENDPOINT = 'localhost:5558'
    var socket = io(ENDPOINT, {
                    transports: ['websocket', 'polling', 'flashsocket'],
                    reconnection: true,
                    reconnectionAttempts: Infinity})
    
    //Initialize state variables
    let [name, setName] = useState(null)
    let [email, setEmail] = useState(null)
    let [password, setPassword] = useState(null)
    var [test, setTest] = useState("")
    // Use LocalStorage to preserve authentication state
    let [authenticated, setAuthentication] = useLocalStorage("authenticated", false)

    let [partnerDrivers, setPartnerDrivers] = useState([])
    let [driversCount, setDriversCount] = useState(5)
    let [totalMoney, setTotalMoney] = useState(5) 
    let [totalMoneyToday, setTotalMoneyToday] = useState(5)
    let [allData, setAllData] = useState({})

 
    const [details, setDetails] = useLocalStorage("details", {name:"", email:"", password:""})
    const [error, setError] = useState("")
    

    useEffect(() => {
        
        if(authenticated) {
            if(interval === null) {

                interval = setInterval(() => {
                    console.log("Counting......")
    
                    socket.emit("getPartnerData", { provider: details.name })
        
                    socket.on("getPartnerData-response", (data) => {
                        console.log("getting getPartnerData-response data")

                        /*let List = data.drivers_list.map((user) => {
                            return new Promise((outcome) => {
                                
                            })
                        })*/
                        /*let total_money = data.total_money
                        let total_money_today = data.total_money_today
                        let drivers_count = data.drivers_count
                        let mydata = data.drivers  */
                        if ((data !== undefined) || (data != null)) {
                            setPartnerDrivers([...data["drivers"]])
                            setTotalMoney(data["total_money"])
                            setTotalMoneyToday(data["total_money_today"])
                            setDriversCount(data["drivers_count"])

                            console.log(data)
                            setAllData(data)
                            console.log(`All data: ${allData}`)

                            console.log(`total money: ${totalMoney}`)
                            console.log(`total money today : ${totalMoneyToday}`) 
                            console.log(`drivers count: ${driversCount}`) 
                            console.log(`drivers list: ${partnerDrivers}`)
                            //console.log(`DRIVERS: ${partnerDrivers[0].phone_number}`)
                            console.log(partnerDrivers)
                        }
                        
                    })                    
                },1000)
            }

        }
        
        return(() => {
            clearInterval(interval)
        })
       
    }, [ENDPOINT, 
        /*details, 
        allData, 
        partnerDrivers,
        totalMoney,
        totalMoneyToday,
        driversCount,
        authenticated,
        socket */
    ])

    const Logout = () => {
        setAuthentication(false)
       
        setDetails({name:"", email:"", password:""})
        
        return(() => {clearInterval(interval)})
        
    }

    const submitHandler = e => {
        e.preventDefault()
        //Authenticate user:
        socket.emit("authenticate", {
            name: details.name,
            email: details.email,
            password: details.password
        })
       
        socket.on("authenticate-response", (data) => {
            
            if(data.authenticated) {
                //  Upon successful authentication:
                setAuthentication(true)  
                setName(details.name)
                setEmail(details.email)
                setPassword(details.password)
              
                if (interval === null ) {

                    interval = setInterval(() => {
                        console.log("Counting2......")
        
                        socket.emit("getPartnerData", {provider: details.name})
            
                        socket.on("getPartnerData-response", (data) => {
                            console.log("getting getPartnerData-response data")
                            
                            /*let total_money = data.total_money
                            let total_money_today = data.total_money_today
                            let drivers_count = data.drivers_count
                            let mydata = data.drivers_list*/

                            setPartnerDrivers(data.drivers)
                            setTotalMoney(data.total_money)
                            setTotalMoneyToday(data.total_money_today)
                            setDriversCount(data.drivers_count)

                            console.log(`received data from socket" ${data.total_money}`)
                            console.log(`partners's total money2 : ${data.drivers[0]}`)
                        })                    
                    },1500) 
                }
                             
            }
            else {

                setError("No match found")
            }
        })
        
    } 
    //
    const driverData = () => {
        return partnerDrivers.map((driver) => {
            return <DriverRow driver={driver} />
        })
        
    }

    console.log(allData.drivers)
    // styles:
    const card = {
        backgroundColor: "#62bbde"
    }
    const card_header = {
        backgroundColor: "#3183a3",
        
    }
    // Returned content:
    if (!authenticated) {
        return(
            
            <div>
                <form onSubmit={submitHandler}>
                    <div className="form-inner">
                    <h2>Login</h2>
                    {(error != "") ? ( <div className="error">{error}</div>) : ""}
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input type="text" name="name" id="name"
                                onChange={e => setDetails({...details, name: e.target.value})} value={details.name} >
                        </input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" name="email" id="email"
                                onChange={e => setDetails({...details, email: e.target.value})} value={details.email}>
                        </input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" name="password" id="password"
                                onChange={e => setDetails({...details, password: e.target.value})} value={details.password}>
                        </input>
                    </div>
                    <input type="submit" value="LOGIN" />
                    </div>
                </form>
            </div>
        )

    } else {
        return(
            <div >

                <nav className="navbar navbar-expand-lg " style={{ backgroundColor: "#0b5054"}}>
                    <a className="navbar-brand" href="#" style={{color:"white", marginLeft: 100}}>Dashboard</a>

                    <ul className="nav ml-auto">
                    <li className="nav-item">
                        <a className="nav-link active" style={{marginRight: 45}}>
                            <button className="btn btn-primary btn-sm" type="submit" onClick={Logout}>Logout
                            </button></a>
                    </li>
                    
                    </ul>
                </nav>

                <div className="jumbotron jumbotron-fluid text-center">
                    <div className="container">
                        <h1 className="display-4">Welcome to your dashboard</h1>
                        <p className="lead">Additional data available upon request</p>
                        <hr class="my-4"></hr>
                    </div>
                </div>

                <div className="container">
                    
                    <div class="container">
                        <div class="row text-center">
                            <div class="col-sm">
                                <div className="card" style={card}>
                                <div className="card-header" style={card_header}>
                                    Registered drivers 
                                </div>
                                <div className="card-body">
                                    <h3>{ driversCount }</h3>
                                </div>
                                </div>
                            </div>
                            <div class="col-sm">
                                <div className="card" style={card}>
                                <div className="card-header" style= {card_header}>
                                    Total fare
                                </div>
                                <div className="card-body">
                                    <h3>{ totalMoney }</h3>
                                </div>
                                </div>
                            </div>
                            <div class="col-sm">
                                <div className="card" style={card}>
                                <div className="card-header" style={card_header}>
                                    Total fare today 
                                </div>
                                <div className="card-body">
                                    <h3>{ totalMoneyToday }</h3>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>


                 
                    <br></br>
                    
                    <div className="card">
                        <div className="card-header">
                            Registered drivers 
                        </div>
                        <div className="card-body">
                        <table className="table-striped" style={{ margin: 15}}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>Profile</th>
                                        <th>Name</th>
                                        <th>Surname</th>
                                        <th>Phone </th>
                                        <th>Taxi Number</th>
                                        <th>Plate number</th>
                                        <th>Car brand</th>
                                        <th>Status</th>
                                        <th>Daily profit</th>
                                        <th>TotalProfit</th>
                                        <th>Daily connect</th>
                                        <th>Total connect</th>
                                    </tr>

                                </thead>
                                <tbody>
                                { driverData() }
                                </tbody>
                            </table> 
                            </div>
                        </div>
                </div>           
            </div>
        )
    }
}

