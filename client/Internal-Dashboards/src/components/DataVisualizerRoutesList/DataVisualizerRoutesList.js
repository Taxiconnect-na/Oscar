import React from 'react'
import './DataVisualizerRoutesList.css'
import Sidebar from "../sidebar/sidebar"

export default function DataVisualizerRoutesList() {

    const rideCountsRedirect = () => {
      window.location = "/visualize-ride-counts"
    }
    const grossSalesRedirect = () => {
      window.location = "/visualize-gross-sales"
    }
    const revenuesRedirect = () => {
      window.location = "/visualize-revenues"
    }
    const connectTypeRedirect = () => {
      window.location = "/visualize-connect-types"
    }
    const paymentMethodRedirect = () => {
      window.location = "/visualize-payment-methods"
    }

    const monthlyDataDetailedRedirect = () => {
      window.location = "/monthly-data-detailed"
    }

    let section_styles = {
      display:"grid",
      placeItems:"center",
      backgroundColor: "#e2dff0",
      margin:"1%",
      padding:"1%"
    }
  return (

      <div className="template">
              
        <div className="sidebar">
            <Sidebar />
        </div>

        <div className="main-content" >
            <h1 style = {{ display:  "grid", placeItems: "center", paddingTop: "2%", marginBottom:"2%" }}> VISUALIZE DATA </h1>

            <h4 style={section_styles}> Monthly Basis </h4>
            <div className="main-container-DataVisualizerRoutesList">
          
              <div className="view-options" onClick ={() => { rideCountsRedirect() }}>
                Rides
              </div>
              <div className="view-options" onClick ={() => { grossSalesRedirect() }}> 
                Gross Sales
              </div >
              <div className="view-options" onClick ={() => { revenuesRedirect() }}>
                Revenues 
              </div>
              <div className="view-options" onClick ={() => { connectTypeRedirect() }}>  
                Connect Types
              </div>
              <div className="view-options" onClick ={() => { paymentMethodRedirect() }}>  
                Payment Methods
              </div>
            </div>

            <h4 style={section_styles}> Daily Basis </h4>
            <div className="main-container-DataVisualizerRoutesList">
              <div className="view-options" onClick ={() => { monthlyDataDetailedRedirect() }}>  
                Daily Data per Month
              </div>
            </div>
            

              
        </div>  
      </div>
  )
}
