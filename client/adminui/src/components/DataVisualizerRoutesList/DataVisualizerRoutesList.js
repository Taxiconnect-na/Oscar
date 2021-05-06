import React from 'react'

export default function DataVisualizerRoutesList() {

    const rideCountsRedirect = () => {
        window.location = "/visualize-ride-counts"
    }
  return (
    <div>
        <div onClick ={() => { rideCountsRedirect() }}> Ride Counts</div>
        <div> Gross Sales</div>
        <div> Revenues </div>
        <div> Connect Type Counts </div>
        <div> Payment Method Counts </div>
    </div>
  )
}
