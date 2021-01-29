import React, {useState, useEffect} from "react"
import io from 'socket.io-client'
import "./deliveryOverview.css"
import Sidebar from "../sidebar/sidebar"

/**
 * 
 * @function DeliveryRow : Returns single ride details
 */

const DeliveryRow = (props) => {
    let statepick
    let statepickword
    let statedrop
    let [details, setDetails] = useState(false)
    let detailButton = details? "less":"more"
    
    if (props.delivery.isDroppedPassenger===true) {
        statedrop = "YES"
    } else {
        statedrop = "NO"
    }

    if (props.delivery.isPickedUp === true) {
        statepick = {backgroundColor:"green"}
        statepickword = "YES"
    } else {
        statepick = {backgroundColor:"red"}
        statepickword = "NO"
    }
    // Create a list of available destinations
    const dest = () =>{
        return props.delivery.destinations.map((d) => {
            return <ul><li>{d.location_name}</li></ul>
        })
    }
    return(
        <>
        <tr style ={{ backgroundColor: "#ebd113"}}>
            <td>2</td>
            <td>YN067D</td>
            <td>{ props.delivery.origin}</td>
            <td>{ props.delivery.request_type}</td>
            <td>{ props.delivery.date_time }</td>
            <td>{ props.delivery.date_time }</td>
            <td style={ statepick }>{ statepickword }</td>
            <td>{ statedrop }</td>
            <td>{ props.delivery.delivery_receiver } ({props.delivery.delivery_phone})</td>
            <td><button className="btn btn-outline-info btn-sm" onClick={ () => {
                    setDetails(!details)  
            }}>{ detailButton }</button></td>    
        </tr>
        <tr style = {{ display: details? "":"none" }}>
            <td className="data-table" >
                <table className="table" style={{ textAlign: "center"}} id="iner-table">
                    <thead className="thead-light">
                        <tr>
                            <th colSpan="8">Requestor info</th>
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
                            <td className="td-second">{ props.delivery.name }</td>
                            <td className="td-second">{props.delivery.surname }</td>
                            <td className="td-second">{ props.delivery.cellphone }</td>
                            <td className="td-second">{ props.delivery.gender }</td>
                            <td className="td-second">{ props.delivery.payment_method }</td>
                            <td className="td-second">N$ { props.delivery.amount }</td>
                            <td className="td-second">fq{ props.delivery.amount}</td>
                            <td className="td-second">{dest()}</td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
       </>
        

    )
}


function DeliveryOverview() {


    let [deliveries, setDeliveries] = useState([])   // Main ride list of objects
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
            console.log("kaputo@taxiconnect-delivery")
            socket.on("getDeliveryOverview-response", (data) => {
                if ((data !== undefined) && (data != null)) {
                    /* Do something
                    data.map((ride) => {
                        console.log(ride)
                    }) */
                    setDeliveries(data)
                } else {
                    console.log(data.error) // data.error ?
                    alert("Something went wrong while retrieving Data")
                }
            })
            socket.emit("getDeliveryOverview", {data: "Get delivery-overview Data!"})
        },1000)

        return( () => {
            clearInterval(interval)
        })
    
    }, [
        // re-render whenever any of these changes
        deliveries,
        ENDPOINT
    ])

    const DeliveryList = () => {
        return deliveries.map( currentDelivery => {
            return <DeliveryRow delivery={currentDelivery}  />
        })
    }

    const title_style = {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 15
    }
    return(
       
        <div>

            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={ title_style }> Deliveries Overview </h1>
                    <table className="table" style={{ textAlign: "center"}}>
                        <thead className="thead-light">
                            <tr>
                                <th>#</th>
                                <th>Taxi number</th>
                                <th>Origin</th>
                                <th>Request type</th>
                                <th>Date</th>
                                <th>Time requested</th>
                                <th>Item picked up</th>
                                <th>Item dropped off</th>
                                <th>Receiver</th>
                                <th>...</th>
                            </tr>
                        </thead>
                        <tbody>
                            { DeliveryList() }
                        </tbody>
                    </table>
                </div>
            </div>



            
            
        </div>
    
    )
}

export default DeliveryOverview