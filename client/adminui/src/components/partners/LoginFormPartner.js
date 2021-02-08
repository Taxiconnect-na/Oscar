import React, { useState }from 'react'
import io from 'socket.io-client'



export default function LoginFormPartner() {

    var ENDPOINT = 'localhost:5558'
    var socket = io(ENDPOINT, {transports: ['websocket', 'polling', 'flashsocket']})

    const [details, setDetails] = useState({name:"", email:"", password:""})
    const [error, setError] = useState("")

    const submitHandler = e => {
        e.preventDefault()


        socket.emit("authenticate", {
            name: details.name,
            email: details.email,
            password: details.password
        })
       
        socket.on("authenticate-response", (data) => {
            
            let authentication_state = data.authenticated
            console.log(data)

            if(authentication_state) {

                window.location = `/partnerAdmin?name=${details.name}&&email=${details.email}&&password=${details.password}`
            }
            else {

                setError("No match found")
            }
        })
        
    } 

  return (
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
}
