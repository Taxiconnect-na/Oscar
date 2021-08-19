import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import "./LoginButton.css"

export default function LoginButton() {
    const { loginWithRedirect } = useAuth0()
    const buttonStyle = {
      width: 120
    }
  return (
    <div className="container" id="loginButton">
      <button id="loginButton-child"className="btn btn-info btn-lg" style={buttonStyle} onClick={() => loginWithRedirect() }>
       Log in
      </button>
    </div>
   
  )
}
