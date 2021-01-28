import React, {useState, useEffect} from "react"
import io from 'socket.io-client'
import "./rideOverview.css"
import Sidebar from "../sidebar/sidebar"

const RideRow = (props) => {
    return(
        <>
        <tr>
            <td>2</td>
            <td>XN034</td>
            <td>rtyer{ props.ride.passengers_number}</td>
            <td>retyre{ props.ride.request_type}</td>
            <td>ert{ props.ride.date_time }</td>
            <td>rty{ props.ride.date_time }</td>
            <td>ert{ props.ride.isPickedUp }</td>
            <td>etr{ props.ride.isDroppedPassenger}, { props.ride.isDroppedDriver}</td>
            <td>ert{ props.ride.connect_type }</td>
            <td><button className="btn btn-outline-info btn-sm">more</button></td>    
        </tr>
        <tr >
            <td className="data-table" >
                <table className="table " id="iner-table">
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
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="td-second">ert{ props.ride.name }</td>
                            <td className="td-second">ru{props.ride.surname }</td>
                            <td className="td-second">ryn{ props.ride.cellphone }</td>
                            <td className="td-second">qe{ props.ride.gender }</td>
                            <td className="td-second">qef{ props.ride.payment_method }</td>
                            <td className="td-second">N$ { props.ride.amount }</td>
                            <td className="td-second">fq{ props.ride.amount}</td>
                            <td className="td-second">qre{ props.ride.amount}</td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
       </>
        

    )
}


function RideOverview() {

   /* tripDetails.passengers_number = passengers_number
    tripDetails.request_type = request_type
    tripDetails.date_time = date_time
    tripDetails.isPickedUp = isPickedUp
    tripDetails.isDroppedPassenger = isDroppedPassenger
    tripDetails.isDroppedDriver = isDroppedDriver
    tripDetails.connect_type = connect_type
    tripDetails.payment_method = payment_method 
    tripDetails.amount = amount 
    tripDetails.destinations = destinations
    tripDetails.name = name 
    tripDetails.surname = surname
    tripDetails.gender = gender
    tripDetails.cellphone = cellphone */

    let [rides, setRides] = useState([])   // Main ride list of objects
    let [passengers_number, setPassengersNumber] = useState(0)
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
    let [cellphone, setCellphone] = useState('')
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
        },1500)
    
    }, [
        // re-render whenever any of these changes
        rides,
        ENDPOINT
    ])

    const rideList = () => {
        return rides.map( currentRide => {
            return <RideRow ride={currentRide}  />
        })
    }
    return(
       
        <div>

            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >

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
                            { rideList() }
                        </tbody>
                    </table>
                </div>
            </div>



            
            
        </div>
    
    )
}

export default RideOverview