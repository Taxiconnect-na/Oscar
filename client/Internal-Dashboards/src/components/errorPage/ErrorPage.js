import React from 'react'
import { VscError } from "react-icons/vsc"
import "./error.css"

export default function ErrorPage() {
  const style = {
    color: "red",
    margin: "auto",
    width: "70%",
    textAlign: "center",
    padding: "3%"
  }

  const GoHome = () => {
    window.location = "/driver-registration"
  }
  return (
    <div className="error-page-body">
      <div style={style}>
        <h1 > 
          <VscError style={{width: 50, height: 50, color: "red"}} />
                Action not completed <br></br>
        </h1>

        <button className="btn btn-primary" onClick={() => GoHome()}>Go back</button>
      </div>

    </div>
  )
}
