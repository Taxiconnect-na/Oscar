import React, {useState, useEffect} from "react"
import io from 'socket.io-client'
import "./rideOverview.css"
import Sidebar from "../sidebar/sidebar"

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
            socket.on("getRideOverview", (data) => {
                if ((data !== undefined) && (data != null)) {
                    // Do something
                    console.log("Who?")
                    console.log(`The data : ${data}`)
                } else {
                    console.log(data.error) // data.error ?
                    alert("Something went wrong while retrieving Data")
                }
            })
        },1500)
    
    })
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
                            <tr>
                                <td >1</td>
                                <td>POJN</td>
                                <td>1</td>
                                <td>Immediate</td>
                                <td>26-01-2021</td>
                                <td> 11:24</td>
                                <td >????</td>
                                <td>****</td>
                                <td>Connect Me</td>
                                <td><button className="btn btn-outline-info btn-sm">more</button></td>    
                            </tr>
                            <tr >
                            <td className="data-table" >
                                <table className="table " id="iner-table">
                                    <thead className="thead-light">
                                        <tr>
                                            <th colSpan="8">My info</th>
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
                                            <td className="td-second">Fatshi</td>
                                            <td className="td-second">Betton</td>
                                            <td className="td-second">+243 819999999</td>
                                            <td className="td-second">Male</td>
                                            <td className="td-second">CASH</td>
                                            <td className="td-second">N$ 28</td>
                                            <td className="td-second">University of Namibia</td>
                                            <td className="td-second">Windhoek west</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>



            
            
        </div>
    
    )
}

export default RideOverview