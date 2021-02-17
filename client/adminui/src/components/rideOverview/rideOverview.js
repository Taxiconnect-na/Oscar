import React, {useState, useEffect} from "react"
import io from 'socket.io-client'
import "./rideOverview.css"
import Sidebar from "../sidebar/sidebar"
require("dotenv").config({ path : "../../../.env"})




/**
 * @function GetCashWallet : Returns the total money of trips in progress, scheduled and completed
 *                          Of a given array of rides (cash and delivery returned)
 * @param {array} arrayData : An array of rides from either an API or Database of rides with known
 *                            keys. 
 * 
 */

function GetCashWallet(arrayData, resolve) {
  
    let fare_array = [];
    let fare_array_cash = [];
    let fare_array_wallet = [];
    const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0);
    
    arrayData.map((ride) => {
        fare_array.push(Number(ride["amount"]));

        // Get rides with CASH as payment method
        let payment_method = ride["payment_method"].toUpperCase().trim();
        if (/CASH/i.test(payment_method)) {
        // if (payment_method ==="CASH") /CASH/ makes sure of spacing
        fare_array_cash.push(Number(ride["amount"]));
        } else {
        fare_array_wallet.push(Number(ride["amount"]));
        }
    });
    
    let totalCash = Sum(fare_array_cash);
    let totalWallet = Sum(fare_array_wallet);
    let totalCashWallet = totalCash + totalWallet;
    let CashWalletObject = { totalCash, totalWallet, totalCashWallet };

    resolve(CashWalletObject)

    //return CashWalletObject
}

/**
 * @function progressScheduledCompleted : Returns the total count and money of trips in progress, 
 *                                        scheduled and completed
 *                          Of a given array of rides (cash and delivery returned)
 * @param {array} arrayData : An array of rides from either an API or Database of rides with known
 *                            keys. 
 * 
 */

function progressScheduledCompleted(arrayData, resolve) {
    
    let progress = arrayData.filter(current => {
        return !current.isArrivedToDestination
    })

    let scheduled = arrayData.filter(current => {
        let Value = current.request_type === "scheduled" && current.isArrivedToDestination===false
        return Value
    })
    let completed = arrayData.filter( current => {
        return current.isArrivedToDestination
    })

    let completed_today = arrayData.filter( current => {
        let startOfToday = new Date()
        let convertToday = new Date(startOfToday.setHours(0, 0, 0, 0)).toISOString()
        //console.log(current.date_time)
        //console.log(startOfToday)
        
        console.log(`today start: ${convertToday}`)
        console.log(`received date: ${current.date_time}`)
        let today = (new Date(current.date_time)) > (new Date(convertToday))
        console.log(`Date comparison result: ${today}`)
        return (today && current.isArrivedToDestination)
    })
    console.log(completed_today)
    
    Promise.all([
            //let progressMoney = GetCashWallet(scheduled)
        new Promise((res) => {
            GetCashWallet(progress, res)
        }),
        new Promise((res) => {
            GetCashWallet(scheduled, res)
        }),
        //let progressMoney = GetCashWallet(scheduled)
        new Promise((res) => {
            GetCashWallet(completed, res)
        }),
        new Promise((res) => {
            GetCashWallet(completed_today,res)
        })

    ]).then((future) => {
        let [progressMoney, scheduledMoney, completedMoney, completedMoneyToday] = future
        let Object = {}
        Object.moneyInprogress = progressMoney
        Object.moneyScheduled = scheduledMoney
        Object.moneyCompleted = completedMoney
        Object.moneyCompletedToday = completedMoneyToday
        Object.inprogress = progress.length
        Object.scheduled = scheduled.length
        Object.completed = completed.length
        Object.completed_today = completed_today.length
        console.log("------------------------------")
        console.log(arrayData)
        resolve(Object)
    }).catch((error) => {

        console.log(error)
        resolve({
            response: "error",
            flag: "Possibly invalid input parameters",
        })
    })
 
}


/**
 * 
 * @function RideRow : Returns single ride details
 */

const RideRow = (props) => {
    let statepick
    let statepickword
    let statedrop
    let statedropword
    let [details, setDetails] = useState(false)
    let detailButton = details? "less":"more"
    
    if (props.ride.isDroppedDriver===true) {
        statedrop = {backgroundColor:"green"}
        statedropword = "YES"
    } else {
        statedrop = {backgroundColor:"red"}
        statedropword = "NO"
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
            
            <td>{ props.ride.taxi_number }</td>
            <td>{ props.ride.passengers_number}</td>
            <td>{ props.ride.request_type}</td>
            <td>{ props.ride.date_time.toString().slice(0,10) }</td>
            <td>{ props.ride.date_time.toString().slice(11,19) }</td>
            <td style={ statepick }>{ statepickword }</td>
            <td style={ statedrop }>{ statedropword }</td>
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
                            <th>Origin</th>
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
                            <td className="td-second">{ props.ride.origin}</td>
                            <td className="td-second">{dest()}</td>
                            <td className="td-second">{props.ride.wished_pickup_time.toString().slice(0,10)} @({props.ride.wished_pickup_time.toString().slice(11,19)})
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
       </>
    )
}

/**
 * @function RideOverview : Main function rendering the rides overview page
 */

function RideOverview() {


    let [rides, setRides] = useState([])   // Main ride list of objects
    let [inProgress, setInProgress] = useState(true)
    let [scheduled, setScheduled] = useState(false)
    let [completed, setCompleted] = useState(false)
    let [InprogressCount, setInProgressCount] = useState(0)
    let [ScheduledCount, setScheduledCount] = useState(0)
    let [CompletedCount, setCompletedCount] = useState(0)
    let [CompletedTodayCount, setCompletedTodayCount] = useState(0)
    let [moneyInprogress, setMoneyInProgress] = useState({})
    let [moneyScheduled, setMoneyScheduled] = useState({})
    let [moneyCompleted, setMoneyCompleted] = useState({})
    let [moneyCompletedToday, setMoneyCompletedToday] = useState({})

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
    
    let ENDPOINT = process.env.GATEWAY

    useEffect(() => {
        let socket = io(ENDPOINT, {
                                    transports: ['websocket', 'polling', 'flashsocket'],
                                    reconnection: true,
                                    reconnectionAttempts: Infinity})
        const interval = setInterval(() => {
            console.log("kaputo@taxiconnect")
            socket.on("getRideOverview-response", (data) => {
                if ((data !== undefined) && (data != null)) {
                    /* Do something
                    data.map((ride) => {
                        console.log(ride)
                    }) */
                    console.log("**********************************")
                    console.log("Received statistics object:")
                    console.log(data)
                    console.log("**********************************")
                    setRides(data)
                    // Get inprogress, scheduled and completed data to update count state
                    new Promise((res) => {
                        progressScheduledCompleted(data, res)
                    }).then((future) => {
                        console.log(future)
                        setInProgressCount(future.inprogress)
                        setMoneyInProgress(future.moneyInprogress)
                        setScheduledCount(future.scheduled)
                        setMoneyScheduled(future.moneyScheduled)
                        setCompletedCount(future.completed)
                        setMoneyCompleted(future.moneyCompleted)
                        setCompletedTodayCount(future.completed_today)
                        setMoneyCompletedToday(future.moneyCompletedToday)
                        
                    }).catch((error) => {
                        console.log(error)
                    })

                } else {
                    console.log(data.error) // data.error ?
                    alert("Something went wrong while retrieving Data")
                }
            })
            socket.emit("getRideOverview", {data: "Get ride-overview Data!"})
        },2000)

        return( () => {
            clearInterval(interval)
        })
    
    }, [
        // re-render whenever any of these changes
        rides,
        ENDPOINT
    ])

    /**
     * @function rideListInProgress : returns the list of rides in progress
     * @function rideListScheduled : returns the list of scheduled rides
     * @function rideListCompleted : returns the list of completed rides
     * 
     */
    
    const rideListInProgress = () => {

        return rides.map( currentRide => {
         
            if ( !currentRide.isArrivedToDestination) {
                return <RideRow ride={currentRide}  />
            } else { 
                //! Do nothing (Do not add the ride to the list if not in progress)
             }
        })
    }

    const rideListScheduled = () => {
        return rides.map( currentRide => {
            if ( currentRide.request_type === "scheduled" && currentRide.isArrivedToDestination===false) {
                
                return <RideRow ride={currentRide}  />
            } else { 
                //! Do nothing (Do not add the ride to the list if not scheduled)
             }
        })
    }

    const rideListCompleted = () => {
        return rides.map( currentRide => {
            if ( currentRide.isArrivedToDestination) {
                
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
    const card = {
        backgroundColor: "#62bbde"
    }
    const card_header = {
        backgroundColor: "#3183a3",
        
    }

    const today = () => {
        return(
           <div style= {{ backgroundColor: "#cbd1d1", marginTop: 0, padding: 15}}>
               <h5 style={{ width: 35, margin: "auto" }}>TODAY</h5>
                            <div id="container-low">
                                <div >
                                    <h1 style={{ fontSize: 'large', color:"white", textAlign: "center"}}> N$ { moneyCompletedToday["totalCash"]} 
                                        <span style={{ fontSize: 'small'}}> cash</span> 
                                    </h1>
                                </div>
                                <div >
                                    <h1 style={{ fontSize: 'large', color:"white", textAlign: "center"}}> N$ { moneyCompletedToday["totalWallet"]}
                                        <span style={{ fontSize: 'small'}}> wallet</span> 
                                    </h1>
                                </div>
                                <div >
                                    <h1 style={{ fontSize: 'large', color:"white", textAlign: "center"}}> N$ { moneyCompletedToday["totalCashWallet"]} 
                                        <span style={{ fontSize: 'small'}}> total</span> 
                                    </h1>
                                </div>
                                <div >
                                    <h1 style={{ fontSize: 'large', color:"white", textAlign: "center"}}> { CompletedTodayCount } 
                                        <span style={{ fontSize: 'small', }}> rides</span> 
                                    </h1>
                                </div>

                            </div>
           </div>
        )
    }

    return(
       
        <div>

            <div className="wrapper">
                <div className="left-column">
                <Sidebar />
                </div>
                <div className="right-column" >
                    <h1 style={ title_style }> Rides Overview </h1>
                    <div style= {{ marginLeft: 200, padding: 10}}>
                        <button style={{ marginLeft: 25}} className="btn btn-info btn-sm " onClick={ () => {
                        setScheduled (false)
                        setCompleted(false)
                        setInProgress(true)  
                        }}>Rides in progress [{ InprogressCount }]</button>

                        <button style={{ marginLeft: 35}} className="btn btn-info btn-sm " onClick={ () => {
                        setInProgress (false)
                        setCompleted(false)
                        setScheduled(true)  
                        }}>Scheduled rides [{ ScheduledCount }]</button>

                        <button style={{ marginLeft: 35}} className="btn btn-info btn-sm " onClick={ () => {
                        setInProgress (false)
                        setCompleted(true)
                        setScheduled(false)  
                        }}>Completed rides [{ CompletedCount }]</button>

                    </div>

                        <div style = {{ display: inProgress? "":"none" }}>
                            
                            <hr></hr>
                            
                            <div >
                                <div className="container">
                                    <div className="row text-center">
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                cash
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyInprogress["totalCash"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style= {card_header}>
                                                wallet
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyInprogress["totalWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                Total  
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyInprogress["totalCashWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr></hr>

                            { today() }

                            <h3 style={ subtitle_style }>Rides in progress </h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                       
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>Driver drop-off confirmation</th>
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
                            
                            <hr></hr>
                            <div >
                                <div className="container">
                                    <div className="row text-center">
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                cash
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyScheduled["totalCash"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style= {card_header}>
                                                wallet
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyScheduled["totalWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                Total  
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyScheduled["totalCashWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr></hr>

                            { today() }

                            <h3 style={ subtitle_style }>Scheduled rides </h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                        
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>Driver dropped off confirmation</th>
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
                            
                            <hr></hr>
                           
                                
                            <div >
                                <div className="container">
                                    <div className="row text-center">
                                        <div class="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                cash
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyCompleted["totalCash"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style= {card_header}>
                                                wallet
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyCompleted["totalWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="col-sm">
                                            <div className="card" style={card}>
                                            <div className="card-header" style={card_header}>
                                                Total  
                                            </div>
                                            <div className="card-body">
                                                <h3>N$ { moneyCompleted["totalCashWallet"] }</h3>
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                
                            <hr></hr>

                            { today() }

                            <h3 style={ subtitle_style }>Completed rides</h3>
                            <table className="table" style={{ textAlign: "center"}}>
                                <thead className="thead-light">
                                    <tr>
                                 
                                        <th>Taxi number</th>
                                        <th>Passengers</th>
                                        <th>Request type</th>
                                        <th>Date</th>
                                        <th>Time requested</th>
                                        <th>Client picked up</th>
                                        <th>Driver dropped off confirmation</th>
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