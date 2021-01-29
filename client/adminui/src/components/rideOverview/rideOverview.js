import React, {useState, useEffect} from "react"
import io from 'socket.io-client'
import "./rideOverview.css"
import Sidebar from "../sidebar/sidebar"

/**
 * 
 * @function RideRow : Returns single ride details
 */

const RideRow = (props) => {
    let statepick
    let statepickword
    let statedrop
    let [details, setDetails] = useState(false)
    let detailButton = details? "less":"more"
    
    if (props.ride.isDroppedPassenger===true) {
        statedrop = "YES"
    } else {
        statedrop = "NO"
    }

    if (props.ride.isPickedUp === true) {
        statepick = {backgroundColor:"green"}
        statepickword = "YES"
    } else {
        statepick = {backgroundColor:"red"}
        statepickword = "NO"
    }
    // Create a list of available destinations
    const dest = () =>{
        return props.ride.destinations.map((d) => {
            return <ul><li>{d.location_name}</li></ul>
        })
    }
    
    return(
        <>
        <tr style ={{ backgroundColor: "#ebd113"}}>
            <td>2</td>
            <td>XN034</td>
            <td>{ props.ride.passengers_number}</td>
            <td>{ props.ride.request_type}</td>
            <td>{ props.ride.date_time }</td>
            <td>{ props.ride.date_time }</td>
            <td style={ statepick }>{ statepickword }</td>
            <td>{ statedrop }</td>
            <td>{ props.ride.connect_type }</td>
            <td><button className="btn btn-outline-info btn-sm" onClick={ () => {
                    setDetails(!details)  
            }}>{ detailButton }</button></td>    
        </tr>
        <tr style = {{ display: details? "":"none" }}>
            <td className="data-table" >
                <table className="table" style={{ textAlign: "center"}} id="iner-table">
                    <thead className="thead-light">
                        <tr>
                            <th colSpan="8">Passenger info</th>
                        </tr>
                        <tr>
                            <th>Name</th>
                            <th>Surname</th>
                            <th>Cellphone</th>
                            <th>Gender</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>From</th>
                            <th>Destination(s)</th>
                            <th>Wished pick up time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="td-second">{ props.ride.name }</td>
                            <td className="td-second">{props.ride.surname }</td>
                            <td className="td-second">{ props.ride.cellphone }</td>
                            <td className="td-second">{ props.ride.gender }</td>
                            <td className="td-second">{ props.ride.payment_method }</td>
                            <td className="td-second">N$ { props.ride.amount }</td>
                            <td className="td-second">fq{ props.ride.amount}</td>
                            <td className="td-second">{dest()}</td>
                            <td className="td-second">{props.ride.wished_pickup_time }</td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
       </>
    )
}


function RideOverview() {


    let [rides, setRides] = useState([])   // Main ride list of objects
    let [inProgress, setInProgress] = useState(true)
    let [scheduled, setScheduled] = useState(false)
    let [completed, setCompleted] = useState(false)
    /*let [passengers_number, setPassengersNumber] = useState(0)
    let [request_type, setRequestType] = useState(0)
    let [date_time, setDateTime] = useState(0)
    let [isPickedUp, setIsPickedUp] = useState(false)
    let [isDroppedPassenger, setIsDroppedPassenger] = useState(false)
    let [isDroppedDriver, setIsDroppedDriver] = useState(false)
    let [connect_type, setConnectType] = useState('')
    let [payment_method, setPaymentMethod] = useState('')
    let [amount, setAmount] = useState(0)
    let [destinations, setDestinations] = useState([])
    let [name, setName] = useState('')
    let [surname, setSurname] = useState('')
    let [gender, setGender] = useState('')
    let [cellphone, setCellphone] = useState('')  */
    
    let ENDPOINT = 'localhost:5558' 

    useEffect(() => {
        let socket = io(ENDPOINT, { transports: ["websocket", "polling", "flashsocket"]})
        const interval = setInterval(() => {
            console.log("kaputo@taxiconnect")
            socket.on("getRideOverview-response", (data) => {
                if ((data !== undefined) && (data != null)) {
                    /* Do something
                    data.map((ride) => {
                        console.log(ride)
                    }) */
                    setRides(data)
                } else {
                    console.log(data.error) // data.error ?
                    alert("Something went wrong while retrieving Data")
                }
            })
            socket.emit("getRideOverview", {data: "Get ride-overview Data!"})
        },1000)

        return( () => {
            clearInterval(interval)
        })
    
    }, [
        // re-render whenever any of these changes
        rides,
        ENDPOINT
    ])

    const rideListInProgress = () => {
        return rides.map( currentRide => {
            if ( currentRide.isAccepted && currentRide.isPickedUp 
                && !currentRide.isDroppedPassenger ) {
                
                return <RideRow ride={currentRide}  />
            } else { 
                //! Do nothing (Do not add the ride to the list if not in progress)
             }
        })
    }

    const rideListScheduled = () => {
        return rides.map( currentRide => {
            if ( currentRide.request_type === "scheduled") {
                
                return <RideRow ride={currentRide}  />
            } else { 
                //! Do nothing (Do not add the ride to the list if not scheduled)
             }
        })
    }

    const rideListCompleted = () => {
        return rides.map( currentRide => {
            if ( currentRide.isAccepted && currentRide.isPickedUp 
                && (currentRide.isDroppedPassenger || currentRide.isDroppedDriver) ) {
                
                return <RideRow ride={currentRide}  />
            } else { 
                //! Do nothing --> Do not add the ride to the list if not completed
                //! the ride is completed upon confirmation of either driver or passenger
                //! Further display difference of both shall be done upon rendering of the row
             }
        })
    }

    const title_style = {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 15
    }
    const subtitle_style = {
        textAlign: "center",
        marginTop: 5,
        marginBottom: 10
    }
    return(
       
        <div>

            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={ title_style }> Rides Overview </h1>
                    <button className="btn btn-outline-info btn-sm " onClick={ () => {
                    setScheduled (false)
                    setCompleted(false)
                    setInProgress(true)  
                    }}>Rides in progress</button>

                    <button className="btn btn-outline-info btn-sm" onClick={ () => {
                    setInProgress (false)
                    setCompleted(false)
                    setScheduled(true)  
                    }}>Scheduled rides</button>

                    <button className="btn btn-outline-info btn-sm" onClick={ () => {
                    setInProgress (false)
                    setCompleted(true)
                    setScheduled(false)  
                    }}>Completed rides</button>

                        <div style = {{ display: inProgress? "":"none" }}>
                            <h3 style={ subtitle_style }>Rides in progress </h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>client dropped off</th>
                                        <th>Connect type</th>
                                        <th>...</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { rideListInProgress() }
                                </tbody>
                            </table>
                        </div>

                        <div style = {{ display: scheduled? "":"none" }}>
                            <h3 style={ subtitle_style }>Scheduled rides </h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>##</th>
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>client dropped off</th>
                                        <th>Connect type</th>
                                        <th>...</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { rideListScheduled() }
                                </tbody>
                            </table>
                        </div>

                        <div style = {{ display: completed? "":"none" }}>
                            <h3 style={ subtitle_style }>Completed rides</h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>###</th>
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>client dropped off</th>
                                        <th>Connect type</th>
                                        <th>...</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { rideListCompleted() }
                                </tbody>
                            </table>
                        </div>
                </div>
            </div>



            
            
        </div>
    
    )
}

export default RideOverview