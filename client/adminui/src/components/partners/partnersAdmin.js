import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import LoginFormPartner from "./LoginFormPartner"
import queryString from 'query-string'

import { BrowserRouter as Router, Link } from 'react-router-dom'

export default function PartnersAdmin({ location }) {

    let [name, setName] = useState(null)
    let [email, setEmail] = useState(null)
    let [password, setPassword] = useState(null)

    let [authenticated, setAuthentication] = useState(false)

    useEffect(() => {
        var ENDPOINT = 'localhost:5558'
        var socket = io(ENDPOINT, {transports: ['websocket', 'polling', 'flashsocket']})

        const { name, email, password } = queryString.parse(location.search) 

        setName(name)
        setEmail(email)
        setPassword(password)

        socket.emit("authenticate", {
            name: name,
            email: email,
            password: password
        })
       
        socket.on("authenticate-response", (data) => {
            
            let authentication_state = data.authenticated
            console.log(data)

            if(authentication_state) {
                setAuthentication(true)

                
            }
            else {

                
            }
        })

        // Set state of variables here to be used to fetch Data 
    },[])
    
    console.log(name)
    

    if (!authenticated) {
        return(

            <div>
                <LoginFormPartner />
            </div>
        )
    } else {
        return(
            <div>
                <h1>Logged in</h1>
                <Link  to={"/login"}>
                    <button className="button mt-20" type="submit"
                    onClick={() => {
                       setAuthentication(false)
                    }}>log out</button>
                </Link>
            </div>
        )
    }
}

/*

 {(requestResult == 400 || requestResult == 404 || requestResult == null ) ? (
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
                
            ) : (
                <div className="welcome">
                    <h2>Welcome, <span>Whatever</span></h2>
                    <button onClick={Logout}>Logout</button>
                </div>
            )}
*/ 