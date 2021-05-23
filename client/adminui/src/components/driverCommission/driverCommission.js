import React, { useEffect, useState } from 'react'
import socket from '../socket'
import Sidebar from "../sidebar/sidebar"


const isToday = (someDate) => {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
}

const DriverRow = (props) => {
    
    const redirectDriverPayment = () => {
        window.location = `/driver-commission-payment?driver_identifier=${ props.driver.driver_fingerprint }&taxi=${ props.driver.taxi_number}&&dname=${props.driver.name}&&dsurname=${props.driver.surname}`
    }

    let todayStyle
    if(isToday(new Date(props.driver.scheduled_payment_date))){
        todayStyle = {
            backgroundColor: "#c43737"
        }
    } else {
        todayStyle = {
            // Empty
        }
    }

    return(
        <tr onClick={ () => { redirectDriverPayment() }} style={todayStyle}>
            <td>{ props.driver.name}</td>
            <td>{ props.driver.surname }</td>
            <td>{ props.driver.phone_number }</td>
            <td>{ props.driver.taxi_number }</td>
            <td>{ props.driver.total_commission }</td>
            <td> { props.driver.wallet_balance }</td>
            <td>{props.driver.scheduled_payment_date.toString().slice(0,10) }</td> 
        </tr>
    )
}

/**
 * * MAIN FUNCTION
 * @returns 
 */
export default function DriverCommission() {

    let [drivers, setDrivers] = useState([])

    useEffect( () => {

        const interval = setInterval(() => {
            console.log("driverslistCommission@taxiconnect")

            socket.on("getDriversWithCommission-response", (data) => {
                if ((data !== undefined) && (data != null)) {
                    console.log(data)
                    //mydata = data
                    setDrivers(data)   

                }
            });
            //...
            socket.emit("getDriversWithCommission", {data:'getting drivers commission'});
        }, 8000)
        
        return( () => {
            clearInterval(interval)
        })

    },[])


    const driverData = () => {
        return drivers.map((driver) => {
            return <DriverRow driver={driver} />
        })
        
    }

  return (
    <div>
        <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={{ display: "grid", placeItems: "center", margin: "2%"}}> DRIVERS PAYMENTS </h1>

                    <table className="table-hover" >
                        <thead className="thead-light">
                            <tr>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Phone </th>
                                <th>Taxi Number</th>
                                <th>Total commission</th>
                                <th>Wallet Balance</th>
                                <th>Scheduled payment date</th>
                            </tr>

                        </thead>
                        <tbody>
                            { driverData() }
                        </tbody>
                    </table>
                </div>
        </div>  
    </div>
  )
}
