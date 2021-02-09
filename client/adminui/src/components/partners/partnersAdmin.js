import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import LoginFormPartner from "./LoginFormPartner"
import queryString from 'query-string'

import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom'

// Hook
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

var interval = null

export default function PartnersAdmin() {

    let [name, setName] = useState(null)
    let [email, setEmail] = useState(null)
    let [password, setPassword] = useState(null)
    var [test, setTest] = useState("")

    let [authenticated, setAuthentication] = useLocalStorage("authenticated", false)
    var ENDPOINT = 'localhost:5558'
    var socket = io(ENDPOINT, {transports: ['websocket', 'polling', 'flashsocket'],
                                reconnection: true,
                            reconnectionAttempts: Infinity})
                            
    let [partnerData, setPartnerData] = useState({})

 
    const [details, setDetails] = useLocalStorage("details", {name:"", email:"", password:""})
    const [error, setError] = useState("")
    

    useEffect(() => {
        
        if(authenticated) {
            if(interval === null) {

                interval = setInterval(() => {
                    console.log("Counting......")
    
                    socket.emit("getPartnerData", { provider: details.name })
        
                    socket.on("getPartnerData-response", (data) => {
                        console.log("HELOOOOOOOOOOOO")
                        let total_money = data.total_money
                        setPartnerData(data)
                        console.log(`received data from socket" ${data.total_money}`)
                        console.log(`partners's total money : ${total_money}`) 
                    })                    
                },1000)
            }
            

        }
        
        return(() => {
            clearInterval(interval)
        })
       
    }, [])

    const Logout = () => {
        setAuthentication(false)
       
        setDetails({name:"", email:"", password:""})
        
        return(() => {clearInterval(interval)})
        
    }

    const submitHandler = e => {
        e.preventDefault()

        socket.emit("authenticate", {
            name: details.name,
            email: details.email,
            password: details.password
        })
       
        socket.on("authenticate-response", (data) => {

            if(data.authenticated) {

                setAuthentication(true)  
                setName(details.name)
                setEmail(details.email)
                setPassword(details.password)
                //setDetails({name:"", email:"", password:""})
                if (interval === null ) {

                    interval = setInterval(() => {
                        console.log("Counting2......")
        
                        socket.emit("getPartnerData", {provider: details.name})
            
                        socket.on("getPartnerData-response", (data) => {
                            console.log("HELOOOOOOOOOOOO")
                            setPartnerData(data)
                            console.log(`received data from socket" ${data.total_money}`)
                            console.log(`partners's total money : ${partnerData.total_money}`)
                        })                    
                    },1000) 
                }
                             
            }
            else {

                setError("No match found")
            }
        })
        
    } 


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
            <div>
                <h1>Logged in</h1>
                    <h1>Hi {test} </h1>
                    <button className="button mt-20" type="submit"
                    onClick={Logout}>log out</button>                
            </div>
        )
    }
}

