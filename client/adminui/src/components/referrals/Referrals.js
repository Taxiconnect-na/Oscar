import React, { useState } from 'react'
import { } from "./ReferralsStyles"
import "./Referrals.css"
import { MdExpandMore } from "react-icons/md"
import { VscTriangleDown } from "react-icons/vsc"


const ActiveRow = (props) => {
  let [details, setDetails] = useState(false)

  const PaymentHandler = () => {
    fetch(`{ process.env.REACT_APP_DRIVER_SERVER }/update-referral-paid-status/{ props.data.referral_fingerprint}`)
    .then((data) => data.json())
    .then((response) => {
      if(response.success) {
        console.log("successful update @paymentHandler")
      } else {
        console.log("failure oto update @paymentHandler")
      }
    })
    .catch((error) => {
      console.log(error)
    })
  }

  const RejectionHandler = () => {
    
  }
  const DeleteReferralUserSideHandler = () => {
    
  }
  const DeleteReferral = () => {
    
  }
  const registerReferredDriver = () => {

  }
  return(
    <>
      <tr> 
        <td>{ props.data.date_referred.toString().slice(0,10) } | { props.data.date_referred.toString().slice(11,19) }</td>
        <td>{ props.data.driver_phone }</td>
        <td>{ props.data.taxi_number }</td>
        <td>{ props.data.expiration_time.slice(0,10)} | { props.data.expiration_time.slice(11,19) }</td>
        <td>{ props.data.driver_name }</td>
        <td>{ props.data.is_paid? "Yes":"No"}</td>
        <td><VscTriangleDown onClick={ () => setDetails(!details)}/> </td>
      </tr>
      
      <td colSpan={7} style= {{ display: details? "":"none"}} className="hide">
        <table style={{ width: "100%"}} className="table-bordered">
          <thead>
            <tr> 
              <th colSpan={2}>Referrer</th>
              <th> Actions </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              <td>{ props.data.referrer_name }</td>
              <td rowSpan={4}>
                <div style={{}} className="active-referrals-action">
                  <div>
                    <button className="btn btn-success btn-sm" onClick={() => PaymentHandler()}>
                    { props.data.is_paid? "Mark Unpaid": "Mark Paid"}
                    </button>
                  </div>
                  <div><button className="btn btn-success btn-sm">{ props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                  <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                </div>
              </td>
            </tr>
            <tr>
              <td>Phone number</td>
              <td>{ props.data.referrer_phone_number}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{ props.data.referrer_email }</td>
            </tr>
            <tr>
              <td>Nature</td>
              <td>{ props.data.user_referrer_nature }</td>
            </tr>
          </tbody>
        </table>
      </td> 
    </>
  )
}


const ExpiredRow = (props) => {
  let [details, setDetails] = useState(false)
  return(
    <>
      <tr> 
        <td>{ props.data.date_referred.toString().slice(0,10) } | { props.data.date_referred.toString().slice(11,19) }</td>
        <td>{ props.data.driver_phone }</td>
        <td>{ props.data.taxi_number }</td>
        <td>{ props.data.expiration_time.slice(0,10)} | { props.data.expiration_time.slice(11,19) }</td>
        <td>{ props.data.driver_name }</td>
        <td>{ props.data.is_paid? "Yes":"No"}</td>
        <td><VscTriangleDown onClick={ () => setDetails(!details)}/> </td>
      </tr>
      
      <td colSpan={7} style= {{ display: details? "":"none"}} className="hide">
        <table style={{ width: "100%"}} className="table-bordered">
          <thead>
            <tr> 
              <th colSpan={2}>Referrer</th>
              <th> Actions </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              <td>{ props.data.referrer_name }</td>
              <td rowSpan={4}>
                <div style={{}} className="active-referrals-action">
                  <div><button className="btn btn-success btn-sm">{ props.data.is_paid? "Mark Unpaid": "Mark Paid"}</button></div>
                  <div><button className="btn btn-success btn-sm">{ props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                  <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                </div>
              </td>
            </tr>
            <tr>
              <td>Phone number</td>
              <td>{ props.data.referrer_phone_number}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{ props.data.referrer_email }</td>
            </tr>
            <tr>
              <td>Nature</td>
              <td>{ props.data.user_referrer_nature }</td>
            </tr>
          </tbody>
        </table>
      </td> 
    </>
  )
}

const RejectedRow = (props) => {
  let [details, setDetails] = useState(false)
  return(
    <>
      <tr> 
        <td>{ props.data.date_referred.toString().slice(0,10) } | { props.data.date_referred.toString().slice(11,19) }</td>
        <td>{ props.data.driver_phone }</td>
        <td>{ props.data.taxi_number }</td>
        <td>{ props.data.expiration_time.slice(0,10)} | { props.data.expiration_time.slice(11,19) }</td>
        <td>{ props.data.driver_name }</td>
        <td>{ props.data.is_paid? "Yes":"No"}</td>
        <td><VscTriangleDown onClick={ () => setDetails(!details)}/> </td>
      </tr>
      
      <td colSpan={7} style= {{ display: details? "":"none"}} className="hide">
        <table style={{ width: "100%"}} className="table-bordered">
          <thead>
            <tr> 
              <th colSpan={2}>Referrer</th>
              <th> Actions </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Name</td>
              <td>{ props.data.referrer_name }</td>
              <td rowSpan={4}>
                <div style={{}} className="active-referrals-action">
                  <div><button className="btn btn-success btn-sm">{ props.data.is_paid? "Mark Unpaid": "Mark Paid"}</button></div>
                  <div><button className="btn btn-success btn-sm">{ props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                  <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                </div>
              </td>
            </tr>
            <tr>
              <td>Phone number</td>
              <td>{ props.data.referrer_phone_number}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{ props.data.referrer_email }</td>
            </tr>
            <tr>
              <td>Nature</td>
              <td>{ props.data.user_referrer_nature }</td>
            </tr>
          </tbody>
        </table>
      </td> 
    </>
  )
}

export default function Referrals() {

  let [active_referrals, setActiveReferrals] = useState([])
  let [expired_referrals, setExpiredReferrals] = useState([])
  let [rejected_referrals, setrejectedReferrals] = useState([])
  let [load_referrals_failure, setLoadReferralsFailure] = useState(false)


  let [active_show, setActiveShow] = useState(true)
  let [expired_show, setExpiredShow] = useState(false)
  let [rejected_show, setRejectedShow] = useState(false)
  let [details, setDetails] = useState(false)

  useState(() => {
    fetch("http://localhost:10020/referrals")
    .then((data) => data.json() )
    .then((referrals) => {
      console.log(referrals)

      if(referrals.success) {

        setActiveReferrals(referrals.data.active_referrals)
        setExpiredReferrals(referrals.data.expired_referrals)
        setrejectedReferrals(referrals.data.rejected_referrals)

      } else {

        setLoadReferralsFailure(load_referrals_failure)
        console.log("Error occured")
      }
      
    })
    .catch((error) => {
      console.log(error)
      setLoadReferralsFailure(load_referrals_failure)
    })
  }, [active_referrals, expired_referrals, rejected_referrals])

  // Data per row for active referrals
  const no_data_style = {
    color: "red",
    padding: "3%"
  }
  const RowDataActive = () => {
    if(active_referrals.length > 0) {
      return active_referrals.map(data => {
        
        return <ActiveRow data={data} />
      }) 
    } else {
      return (
        <td colSpan={7} style={no_data_style}> <h1>No active referral available</h1> </td>
      )
    }

  }


    // Data per row for active referrals
  const RowDataExpired = () => {
    if(expired_referrals.length > 0 ) {

      return expired_referrals.map(data => {
        
        return  <ExpiredRow data={data} />
          
      })
    } else {
      return (
        <td colSpan={7} style={no_data_style}> <h1>No expired referral available</h1> </td>
      )
    }
     
  }

  // Data per row for rejected referrals
  const RowDataRejected = () => {
    if(rejected_referrals.length > 0 ) {

      return rejected_referrals.map(data => {
        
        return <RejectedRow data={data} />
      })
    } else {
      return (
        <td colSpan={7} style={no_data_style}> <h1>No rejected referral available</h1> </td>
      )
    }
      
  }

  /**
   *  SHOW PAGES ( TOGGLE BETWEEN PAGES FUNCTION HANDLERS)
   */
  const ShowActivePage = () => {
    setActiveShow(true)
    setExpiredShow(false)
    setRejectedShow(false)
  }

  const showExpiredPage = () => {
    setActiveShow(false)
    setExpiredShow(true)
    setRejectedShow(false)
  }

  const showRejectedPage = () => {
    setActiveShow(false)
    setExpiredShow(false)
    setRejectedShow(true)
  }


  /*
    active_referrals
    expired_referrals
    rejected_referrals
  */
  const more_icon_style = {
    width: 50,
    height: 20
  }

  const active_style = active_show? {
    color: "yellow",
    borderBottom: "solid 3px"
  } : {}

  const expired_style = expired_show? {
    color: "yellow",
    borderBottom: "solid 3px"
  } : {}

  const rejected_style = rejected_show? {
    color: "yellow",
    borderBottom: "solid 3px"
  } : {}



  return (

    <div style={{ margin: "5%"}}>

      <div>
        <div display={{ float: "right" }}>
          <button className="btn btn-info btn-sm" onClick={() => window.location="/trip-overview/rides"}>
            Back to trips
          </button>
        </div>
        <h1 style={{ display: "grid", placeItems: "center", marginBottom: "1%", marginTop: "0%"}}> REFERRALS  </h1>
      </div>
      <div className="toggle-referral-buttons">
        
        <div style={active_style} className="toggle-referral-text" onClick={() => ShowActivePage()}>
          Active
        </div>
        <div style={expired_style} className="toggle-referral-text" onClick={() => showExpiredPage()}>
          Expired
        </div>
        <div style={rejected_style} className="toggle-referral-text" onClick={() => showRejectedPage()}>
          Rejected
        </div>
      </div>    

      {/** ACTIVE REFERRALS  */}
      <table style={{ width: "100%", display: active_show? "":"none"}} className="table-striped">
        <thead>
          <tr>
            <th>Date Referred</th>
            <th>Driver cell</th>
            <th>Taxi number</th>
            <th>Expiration date</th>
            <th>Driver name</th>
            <th>Paid</th>
            <th> ... </th>
            
          </tr>
        </thead>
        <tbody>
          { RowDataActive() }
        </tbody>

      </table>

      {/** EXPIRED REFERRALS  */}
      <table style={{ width: "100%", display: expired_show? "":"none"}} className="table-striped">
        <thead>
          <tr>
            <th>Date Referred</th>
            <th>Driver cell</th>
            <th>Taxi number</th>
            <th>Expiration date</th>
            <th>Driver name</th>
            <th>Paid</th>
            <th> ... </th>
            
          </tr>
        </thead>
        <tbody>
          { RowDataExpired() }
        </tbody>

      </table>

      {/** REJECTED REFERRALS  */}
      <table style={{ width: "100%", display: rejected_show? "":"none"}} className="table-striped">
        <thead>
          <tr>
            <th>Date Referred</th>
            <th>Driver cell</th>
            <th>Taxi number</th>
            <th>Expiration date</th>
            <th>Driver name</th>
            <th>Paid</th>
            <th> ... </th>
            
          </tr>
        </thead>
        <tbody>
          { RowDataRejected() }
        </tbody>

      </table>

    </div>
  )
}
