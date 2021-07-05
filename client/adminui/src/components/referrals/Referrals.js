import React, { useState } from 'react'
import { } from "./ReferralsStyles"
import "./Referrals.css"
import { MdExpandMore } from "react-icons/md"
import { VscTriangleDown } from "react-icons/vsc"

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
  }, [])


  const RowData = () => {

    return active_referrals.map(data => {
        
      return (
        <>
          <tr> 
            <td>{ data.date_referred.toString().slice(0,10) } | { data.date_referred.toString().slice(11,19) }</td>
            <td>{ data.driver_phone }</td>
            <td>{ data.taxi_number }</td>
            <td>{ data.expiration_time.slice(0,10)} | { data.expiration_time.slice(11,19) }</td>
            <td>{ data.driver_name }</td>
            <td>{ data.is_paid? "Yes":"No"}</td>
            <td><VscTriangleDown onClick={ () => setDetails(!details)}/> </td>
          </tr>
          
          <td colSpan={7} style= {{ display: details? "":"none"}}>
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
                  <td>value</td>
                  <td rowSpan={4}>
                    <div style={{}} className="active-referrals-action">
                      <div><button className="btn btn-success btn-sm">{ data.is_paid? "Mark Unpaid": "Mark Paid"}</button></div>
                      <div><button className="btn btn-success btn-sm">{ data.is_referral_rejected? "Mark unrejected": "Mark rejected"}</button></div>
                      <div><button className="btn btn-warning btn-sm">{"Delete from user"}</button></div>
                      <div><button className="btn btn-warning btn-sm">{"Delete referral"}</button></div>
                      <div><button className="btn btn-info btn-sm">{"Register referred driver"}</button></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Phone number</td>
                  <td>value</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>value</td>
                </tr>
                <tr>
                  <td>Nature</td>
                  <td>{ data.user_referrer_nature }</td>
                </tr>
              </tbody>
            </table>
          </td> 
      </>
      )
    }) 
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
  return (

    <div style={{ margin: "5%"}}>
      <div>
        <h1 style={{ display: "grid", placeItems: "center", margin: "2%"}}> REFERRALS </h1>
      </div>
      <div className="toggle-referral-buttons">
        <div>Active</div>
        <div>Expired</div>
        <div>Rejected</div>
      </div>    
      <table style={{ width: "100%"}} className="table-striped">
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
          { RowData() }
        </tbody>

      </table>

    </div>
  )
}
