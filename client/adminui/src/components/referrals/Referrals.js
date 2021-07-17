import React, { useState } from 'react'
import { } from "./ReferralsStyles"
import "./Referrals.css"
import { MdExpandMore } from "react-icons/md"
import { VscTriangleDown } from "react-icons/vsc"

//Active referrals
const ActiveRow = (props) => {
  let [details, setDetails] = useState(false)
  let [loading, setLoading] = useState(false)
  let [success, setSuccess] = useState(false)
  let [failure, setFailure] = useState(false)

  let [hidePayment, setHidePayment] = useState(true)
  let [hidePaymentButton, setHidePaymentButton] = useState(false)
  let [hidePaymentAsk, setHidePaymentAsk] = useState(false)

  let [hideRejection, setHideRejection] = useState(false)
  let [hideRejectionButton, setHideRejectionButton] = useState(false)
  let [hideRejectionAsk, setHideRejectionAsk] = useState(true)

  let [hideDeletionUserSide, setHideDeletionUserSide] = useState(false)
  let [hideDeleteUserSideButton, setHideDeleteUserSideButton] = useState(true)
  let [hideDeleteUserSideAsk, setHideDeleteUserSideAsk] = useState(false)

  let [hideDeletionReferral, setHideDeletionReferral] = useState(false)
  let [hideDeleteReferralButton, setHideDeleteReferralButton] = useState(true)
  let [hideDeleteReferralAsk, setHideDeleteReferralAsk] = useState(false)

  let [hideRegistration, setHideRegistration] = useState(false)
  
  
  
  // PAYMENT HANDLING
  const PaymentHandler = () => {
    setLoading(true)

    setHidePayment(true)
    setHideRejection(false)
    setHideDeletionUserSide(false)
    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    alert("updating payment status...")
    fetch(`${ process.env.REACT_APP_DRIVER_SERVER }/update-referral-paid-status/${ props.data.referral_fingerprint}`)
    .then((data) => data.json())
    .then((response) => {
      console.log(response)
      if(response.success) {
        setLoading(false)
        setSuccess(true)
        setFailure(false)
        alert("Successfully updated payment status")
        console.log("successful update @paymentHandler")
      } else {
        setLoading(false)
        setSuccess(false)
        setFailure(true)
        alert("failed to update the payment status")
        console.log("failed to update @paymentHandler")
      }
    })
    .catch((error) => {
      setLoading(false)
      setSuccess(false)
      setFailure(true)
      alert("failed to update payment the status")
      console.log(error)
    })
  }
  const showPaymentOption = () => {
    setHidePayment(false)
    setHideRejection(true)
    setHideDeletionUserSide(true)
    setHideDeletionReferral(true)
    setHideRegistration(true)
    setHidePaymentAsk(true)
  }
  const showAllActionsPayment = () => {
    setHidePayment(true)
    setHideRejection(false)
    setHideDeletionUserSide(false)
    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)
  }

  // REJECTION HANDLING
  const RejectionHandler = () => {

    setHidePayment(true)

    setHideRejection(false)
    setHideDeletionUserSide(false)
    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)

    alert("updating rejection status...")
    fetch(`${ process.env.REACT_APP_DRIVER_SERVER }/update-referral-rejection-status/${ props.data.referral_fingerprint}`)
    .then((data) => data.json())
    .then((response) => {
      console.log(response)
      if(response.success) {
       
        alert("Successfully updated rejection status")
        console.log("successful update @rejectionHandler")
      } else {
      
        alert("failed to update the rejection status")
        console.log("failed to update @rejectionHandler")
      }
    })
    .catch((error) => {
     
      alert("failed to update the rejection status.")
      console.log(error)
    })
  }
  const showRejectionOption = () => {
    setHidePayment(true)

    setHideRejection(true)
    setHideRejectionAsk(false)
    setHideRejectionButton(false)

    setHideDeletionUserSide(true)
    setHideDeletionReferral(true)
    setHideRegistration(true)
    setHidePaymentAsk(true)
    
    
  }
  const showAllActionsRejection = () => {
    setHidePayment(true)

    setHideRejection(false)
    setHideDeletionUserSide(false)
    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)
  }

  // DELETION HANDLING FROM RIDER SIDE
  const DeleteReferralUserSideHandler = () => {

    setHidePayment(true)
    setHideRejection(false)

    setHideDeletionUserSide(false)
    setHideDeleteUserSideButton(true)
    setHideDeleteUserSideAsk(false)

    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)

    alert("Deleting referral from rider side...")
    fetch(`${ process.env.REACT_APP_DRIVER_SERVER }/mark-referral-deleted-user-side/${ props.data.referral_fingerprint}`)
    .then((data) => data.json())
    .then((response) => {
      console.log(response)
      if(response.success) {
       
        alert("Successfully Deleted referral from rider side")
        console.log("successful update @DeleteReferralUserSideHandler")
      } else {
      
        alert("failed to Delete referral from rider side")
        console.log("failed to update @DeleteReferralUserSideHandler")
      }
    })
    .catch((error) => {
     
      alert("failed to Delete referral from rider side")
      console.log(error)
    })
  }
  const showDeleteUserSideOption = () => {
    setHidePayment(true)

    setHideDeletionUserSide(false)
    setHideDeleteUserSideButton(false)
    setHideDeleteUserSideAsk(true)

    setHideRejection(true)
    setHideDeletionReferral(true)
    setHideRegistration(true)
    setHidePaymentAsk(true)
  }
  const showAllActionsDeleteUserSide = () => {
    setHidePayment(true)
    setHideRejection(false)

    setHideDeletionUserSide(false)
    setHideDeleteUserSideButton(true)
    setHideDeleteUserSideAsk(false)

    setHideDeletionReferral(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)
  }

  const DeleteReferral = () => {
    setHidePayment(true)
    setHideRejection(false)

    setHideDeletionReferral(false)
    setHideDeleteReferralButton(true)
    setHideDeleteReferralAsk(false)

    setHideDeletionUserSide(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)

    alert("Deleting referral ..")
    fetch(`${ process.env.REACT_APP_DRIVER_SERVER }/delete-referral/${ props.data.referral_fingerprint}`)
    .then((data) => data.json())
    .then((response) => {
      console.log(response)
      if(response.success) {
       
        alert("Successfully Deleted referral ")
        console.log("successful update @DeleteReferral")
      } else {
      
        alert("failed to Delete referral ")
        console.log("failed to update @DeleteReferral")
      }
    })
    .catch((error) => {
     
      alert("failed to Delete referral ")
      console.log(error)
    })
  }
  const showDeleteReferralOption = () => {
    setHidePayment(true)

    setHideDeletionReferral(false)
    setHideDeleteReferralButton(false)
    setHideDeleteReferralAsk(true)

    setHideRejection(true)
    setHideDeletionUserSide(true)
    setHideRegistration(true)
    setHidePaymentAsk(true)
  }
  const showAllActionsDeleteReferral = () => {
    setHidePayment(true)
    setHideRejection(false)

    setHideDeletionReferral(false)
    setHideDeleteReferralButton(true)
    setHideDeleteReferralAsk(false)

    setHideDeletionUserSide(false)
    setHideRegistration(false)
    setHidePaymentAsk(false)

    setHideRejectionAsk(true)
    setHideRejectionButton(false)
  }
  const registerReferredDriver = () => {
    window.location = `/driver-registration-from-referral?referral_fingerprint=${props.data.referral_fingerprint}`
  }
  //Payment
  const hidePaymentButtonStyle = {
    display: hidePayment? "none":""
  }
  const PaymentHideStyle = {
    display: hidePaymentButton? "none":""
  }
  const hidePaymentAskStyle = {
    display: hidePaymentAsk? "none":""
  }
  //Rejection
  const rejectedHideStyle = {
    display: hideRejectionButton? "none":""
  }
  const hideRejectionButtonStyle = {
    display: hideRejectionAsk? "none": ""
  }
  const hideRejectionAskStyle = {
    display: hideRejection? "none":""
  }
  //Delete user side
  const deleteUserSideStyle = {
    display: hideDeletionUserSide? "none":""
  }
  const hideDeleteUserSideAskStyle = {
    display: hideDeleteUserSideAsk? "none":""
  }
  const hideDeleteUserSideButtonStyle = {
    display: hideDeleteUserSideButton? "none":""
  }
  
  //Delete referral completely
  const deleteReferralStyle = {
    display: hideDeletionReferral? "none":""
  }
  const hideDeleteReferralAskStyle = {
    display: hideDeleteReferralAsk? "none":""
  }
  const hideDeleteReferralButtonStyle = {
    display: hideDeleteReferralButton? "none":""
  }

  const registerDriverStyle = {
    display: hideRegistration? "none":""
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
                <div style={PaymentHideStyle} className="active-referrals-action">
                  <div>
                    <button className="btn btn-success btn-sm" onClick={() => showPaymentOption()} style={hidePaymentAskStyle}>
                    { props.data.is_paid? "Mark Unpaid": "Mark Paid"}
                    </button>

                    <div style={hidePaymentButtonStyle} >
                      <h5> Would you like to update the payment status ?</h5>
                      
                        <button className="btn btn-success btn-sm" onClick={() => PaymentHandler()} style={{ margin: "5%"}}>
                          YES
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => showAllActionsPayment()} style={{ margin: "5%"}}>
                          NO
                        </button>
                      
                    </div>
                  </div>

                  <div style={rejectedHideStyle}>
                    <button className="btn btn-success btn-sm" onClick={() => showRejectionOption()} style={hideRejectionAskStyle}>
                      { props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}
                    </button>

                    <div style={hideRejectionButtonStyle} >
                      <h5> Would you like to update the rejection status ?</h5>
                      
                        <button className="btn btn-success btn-sm" onClick={() => RejectionHandler()} style={{ margin: "5%"}}>
                          YES
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => showAllActionsRejection()} style={{ margin: "5%"}}>
                          NO
                        </button>
                      
                    </div>
                  </div>
                  
                  <div style={deleteUserSideStyle}>
                    <button className="btn btn-warning btn-sm" onClick={() => showDeleteUserSideOption()} style={hideDeleteUserSideAskStyle}>
                      {"Delete from rider"}
                    </button>

                    <div style={hideDeleteUserSideButtonStyle} >
                      <h5> Would you like to delete referral from rider side ?</h5>
                      
                        <button className="btn btn-success btn-sm" onClick={() => DeleteReferral()} style={{ margin: "5%"}}>
                          YES
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => showAllActionsDeleteUserSide()} style={{ margin: "5%"}}>
                          NO
                        </button>
                      
                    </div>
                  </div>

                  <div style={deleteReferralStyle}>
                    <button className="btn btn-warning btn-sm" onClick={() => showDeleteReferralOption()} style={hideDeleteReferralAskStyle}>
                      {"Delete referral"}
                    </button>

                    <div style={hideDeleteReferralButtonStyle} >
                      <h5> Would you like to completely delete the referral ?</h5>
                      
                        <button className="btn btn-success btn-sm" onClick={() => DeleteReferral()} style={{ margin: "5%"}}>
                          YES
                        </button>
                        <button className="btn btn-info btn-sm" onClick={() => showAllActionsDeleteReferral()} style={{ margin: "5%"}}>
                          NO
                        </button>
                      
                    </div>
                  </div> 

                  <div style={registerDriverStyle} >
                    <button className="btn btn-info btn-sm" onClick={() => registerReferredDriver() }>
                      {"Register referred driver"}
                    </button>
                  </div>
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
                  <h5> No action available</h5>
                  {/*
                  <div><button className="btn btn-success btn-sm">{ props.data.is_paid? "Mark Unpaid": "Mark Paid"}</button></div>
                  <div><button className="btn btn-success btn-sm">{ props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                  <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                */}
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
                <h5> No action available</h5>
                  {/*
                  <div><button className="btn btn-success btn-sm">{ props.data.is_paid? "Mark Unpaid": "Mark Paid"}</button></div>
                  <div><button className="btn btn-success btn-sm">{ props.data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                  <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                  <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                */}
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
    fetch(`${ process.env.REACT_APP_DRIVER_SERVER }/referrals`)
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
