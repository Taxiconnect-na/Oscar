import React, { useEffect, useState } from 'react'
import Sidebar from "../sidebar/sidebar"

function fetchData(resolve) {
    /*
    const options = {
        method: "GET",
        mode: "no-cors",
        'Access-Control-Allow-Credentials':true
    } */
    fetch(`${process.env.REACT_APP_GATEWAY}/driver-commission`)
    .then( response => response.json())
    .then((data) => {
        console.log(data)
        resolve(data)
    })
    .catch((error) => {
        console.log(error)
        resolve({error: "failed"})
    })
}


const DriverRow = (props) => {

    /*const redirectDriver = () => {
        window.location = `/drivers-update?driverID=${ props.driver.driver_fingerprint }&taxi=${ props.driver.taxi_number}&&dname=${props.driver.name}&&dsurname=${props.driver.surname}&&dplate_number=${props.driver.plate_number}&&brand=${props.driver.car_brand}&&contact=${props.driver.phone_number}&&taxipicture=${props.driver.taxi_picture}`
    }*/
    return(
        <tr>
            <td>{ props.driver.name}</td>
            <td>{ props.driver.surname }</td>
            <td>{ props.driver.phone_number }</td>
            <td>{ props.driver.taxi_number }</td>
            <td>{ props.driver.total_commission }</td>
            <td> { props.driver.wallet_balance }</td>
        </tr>
    )
}

/**
 * * MAIN FUNCTION
 * @returns 
 */
export default function DriverCommission() {

    let [trial, setTrial] = useState(null)
    let [drivers, setDrivers] = useState([])

    useEffect( () => {
        
        new Promise((res) => {
            fetchData(res)
        })
        .then(result => {
            if(result.error) {
                console.log("An error occured", result)
                
            }

            setDrivers(result)
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
                    <h1 style={{ display: "grid", placeItems: "center"}}> DRIVERS PAYMENTS </h1>

                    <table className="table-hover" >
                        <thead className="thead-light">
                            <tr>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Phone </th>
                                <th>Taxi Number</th>
                                <th>Total commission</th>
                                <th>Wallet Balance</th>
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
