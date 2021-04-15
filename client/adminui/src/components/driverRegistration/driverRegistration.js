import React, { Fragment, useState } from 'react'
//import axios from 'axios'
import socket from '../socket'
import DatePicker from 'react-datepicker'
import './driverRegistration.css'
import Sidebar from '../sidebar/sidebar'
import "./Loader.css"
import { VscLoading } from "react-icons/vsc"
import SuccessPage from '../successPage/SuccessPage'
import ErrorPage from "../errorPage/ErrorPage"
import logotaxiconnect from "../../logotaxiconnect.png"


require('dotenv').config({ path: "../../../.env"})


const left_form_style = {
    border: "1px solid #698dc7",
    borderWidth: 2,
    borderRadius: 20,
    padding: 25,
    marginLeft: 20,
    marginTop: 25
}
const right_form_style = {
    border: "1px solid #698dc7",
    borderWidth: 2,
    borderRadius: 20,
    padding: 30,
    marginRight: 25,
    marginTop: 25
}
const car_data_style = {
    border: "1px solid #698dc7",
    borderWidth: 2,
    borderRadius: 20,
    marginTop: 10,
    padding: 40
}


function formObject(
    // Input data:
    name,
    surname,
    title,
    personal_id_number,
    phone_number,
    email,
    operation_clearances,
    delivery_provider,
    profile_picture,
    driver_licence_doc,
    copy_id_paper,
    copy_white_paper,
    copy_public_permit,
    copy_blue_paper,
    blue_paper_expiration,
    driver_licence_expiration,
    owner_name_bank,
    bank_name,
    account_number,
    branch_number,
    branch_name,
    car_brand,
    permit_number,
    taxi_number,
    plate_number,
    max_passengers,
    taxi_picture,
    vehicle_type,
    car_nature,
    account_type,
    //Resolve: to be used as return for async
    resolve) {

        resolve({
            name,
            surname,
            title,
            personal_id_number,
            phone_number,
            email,
            operation_clearances,
            delivery_provider,
            profile_picture,
            driver_licence_doc,
            copy_id_paper,
            copy_white_paper,
            copy_public_permit,
            copy_blue_paper,
            blue_paper_expiration,
            driver_licence_expiration,
            owner_name_bank,
            bank_name,
            account_number,
            branch_number,
            branch_name,
            car_brand,
            permit_number,
            taxi_number,
            plate_number,
            max_passengers,
            taxi_picture,
            vehicle_type,
            car_nature,
            account_type
        })
    }


const DriverRegistration = () => {

        let [name, setName] = useState('')
        let [surname, setSurname] = useState('')
        let [title, setTitle] = useState('')
        let [personal_id_number, setPersonalIdNumber] = useState('')
        let [phone_number, setPhoneNumber] = useState('')
        let [email, setEmail] = useState('')
        //let [password, setPassword] = useState('')
        let [operation_clearances, setOperationClearances] = useState('')
        let [delivery_provider, setDeliveryProvider] = useState('')

        //  Files :
        let [profile_picture, setProfilePicture] = useState('')
        let [profile_picture_name, setProfilePictureName] = useState('Profile picture') 

        let [driver_licence_doc, setDriverLicenceDoc] = useState('')
        let [driver_licence_doc_name, setDriverLicenceDocName] = useState("Driver's licence") 

        let [copy_id_paper, setCopyIdPaper] = useState('')
        let [copy_id_paper_name, setCopyIdPaperName] = useState('Personal ID')

        let [copy_white_paper, setCopyWhitepaper] = useState('')
        let [copy_white_paper_name, setCopyWhitepaperName] = useState('White paper')

        let [copy_public_permit, setCopyPublicPermit] = useState('')
        let [copy_public_permit_name, setCopyPublicPermitName] = useState('Public permit')

        let [copy_blue_paper, setCopyBluePaper] = useState('')
        let [copy_blue_paper_name, setCopyBluePaperName] = useState('Blue paper')
        let [blue_paper_expiration, setBluePaperExpiration] = useState(new Date())
        let [driver_licence_expiration, setDriverLicenceExpiration] = useState(new Date())

        //  Bank Details :
        let [owner_name_bank, setOwnerNameBank] = useState('')
        let [bank_name, setBankName] = useState('')
        let [account_number, setAccountNmber] = useState('')
        let [branch_number, setBranchNumber] = useState('')
        let [branch_name, setBranchName] = useState('')
        let [account_type, setAccountType] = useState('')
        
        // Car data : 
        let [car_brand, setCarBrand] = useState('')
        let [permit_number, setPermitNumber] = useState('')
        let [taxi_number, setTaxiNumber] = useState('')
        let [plate_number, setPlateNumber] = useState('')
        let [max_passengers, setMaxPassengers] = useState(4)
        let [vehicle_type, setVehicleType] = useState('')
        let [car_nature, setCarNature] = useState("")
  
        // car file:
        let [taxi_picture, setTaxiPicture] = useState('')
        let [taxi_picture_name, setTaxiPictureName] = useState('Taxi picture')

        // Registration State
        let [uploading, setUploading] = useState(false)
        let [success, setSuccess] = useState(false)
        let [failure, setFailure] = useState(false)

        //*Attempting to submit without formData */
        const onSubmit = (e) => {
            e.preventDefault()

            // Set Uploading state affirmative
            setUploading(true)

            new Promise((res) => {
                // Form the object:
                formObject(
                    // Input data:
                    name,
                    surname,
                    title,
                    personal_id_number,
                    phone_number,
                    email,
                    operation_clearances,
                    delivery_provider,
                    profile_picture,
                    driver_licence_doc,
                    copy_id_paper,
                    copy_white_paper,
                    copy_public_permit,
                    copy_blue_paper,
                    blue_paper_expiration,
                    driver_licence_expiration,
                    owner_name_bank,
                    bank_name,
                    account_number,
                    branch_number,
                    branch_name,
                    car_brand,
                    permit_number,
                    taxi_number,
                    plate_number,
                    max_passengers,
                    taxi_picture,
                    vehicle_type,
                    car_nature,
                    account_type,
                    //Resolve: to be used as return for async
                    res)

            })
            .then((output) => {

                socket.on("registerDriver-response", (data) => {
                    if ((data !== undefined) && (data != null)) {
                        console.log("=======================================")
                        console.log(data)
                        console.log("=======================================")

                        if(data.success) {
                            
                            setSuccess(true)
                            setUploading(false) 
        
                        } else if(data.failure) {
                            
                            setFailure(true)
                            setUploading(false)
                        }
        
                    } else {
        
                        setFailure(true)
                        setUploading(false)
                        
                    }
                        
                    
                })
    
                socket.emit("registerDriver", output)

            })
            .catch((error) => {
                console.error(error)
                alert("Error occured @client")
            })
                     
        }

        if(uploading) {

            return(
    
                <div className="uploading">
                    
                    <VscLoading style={{width: 120, height: 120, marginTop:"5%", backgroundColor:"#16a0db"}} className="rotate"/>
                    <img src={logotaxiconnect} alt="Loading..." style={{ width: "15%"}} />
                    
                </div>
            )
    
        } else if(success) {
    
            return(
                <SuccessPage />
            )
        } else if(failure) {
    
            return(
                <ErrorPage />
            )
        }

        return (
            <div>
            <div className="wrapper"> 
                <div className="left-column">
                    <Sidebar />
                </div>
                <div className="right-column">
                    <Fragment >
                        <h1 style={{ textAlign: "center", marginBottom: 5, backgroundColor: "#179eb3" }}>
                            Driver Registration</h1>
                        <form onSubmit={onSubmit}> 
                            <div id="wrapper">
                                <div className="literal-info" style={left_form_style}>
                                <div className="form-group ml-4">
                                    <label>Operation clearance </label>
                                    <select
                                        required
                                        className="form-control "
                                        style={{ width: 350 }}
                                        value={operation_clearances}
                                        onChange={(e) => { setOperationClearances(e.target.value) }}>
                                            <option></option>
                                    <option key="Ride" value="Ride">Ride</option>
                                    <option key="Delivery" value="Delivery">Delivery</option>
                                    </select>
                                </div>
                                <div className="form-group ml-4" style={{ display: operation_clearances=="Delivery"? 
                                'block':'none' }}>
                                    <label>Delivery Provider </label>
                                    <select
                                        className="form-control"
                                        value={delivery_provider}
                                        onChange={(e) => { setDeliveryProvider(e.target.value) }}>
                                            <option></option>
                                            <option value="ebikes4Africa">ebikes4Africa</option>
                                            <option value="DeliveryGuy">deliveryGuy</option>
                                            <option value="TwoPointDelivery">TwoPointDelivery</option>
                                            <option value="Tuma">tuma</option>                                
                                    </select>
                                </div>
                                <div className="form-group ml-4">
                                        <label>Name: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            style={{ width: 350 }}
                                            value={ name }
                                            onChange={(e) => { setName(e.target.value)}}
                                            />
                                </div>
                                <div className="form-group ml-4">
                                        <label>Surname: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ surname }
                                            onChange={(e) => { setSurname(e.target.value) }}
                                            style={{ width: 350 }}
                                            />
                                </div>
                                
                                <div className="form-group ml-4">
                                    <label>Title: </label>
                                    <select
                                        required
                                        className="form-control"
                                        style={{ width: 350 }}
                                        value={ title }
                                        onChange={(e) => { setTitle(e.target.value) }}>
                                            <option></option>
                                    <option key="Mr" value="Mr">Mr</option>
                                    <option key="Ms." value="Ms.">Ms.</option>
                                    <option key="Mrs" value="Mrs">Mrs</option>
                                    <option key="Miss" value="Miss">Miss</option>

                                    </select>
                                </div>

                                <div className="form-group ml-4">
                                        <label>Personal ID number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            style={{ width: 350 }}
                                            value={ personal_id_number }
                                            onChange={(e) => { setPersonalIdNumber(e.target.value) }}
                                            />
                                </div>
                                <div className="form-group ml-4">
                                        <label>Phone Number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            style={{ width: 350 }}
                                            value={ phone_number }
                                            onChange={(e) => { setPhoneNumber(e.target.value) }}
                                            />
                                </div>
                                <div className="form-group ml-4">
                                        <label>Email: </label>
                                        <input type="email"
                                            required
                                            className="form-control"
                                            style={{ width: 350 }}
                                            value={ email }
                                            onChange={(e) => { setEmail(e.target.value) }}
                                            />
                                </div>
                                </div>
                                
                                <div className="files-info-bank" style={right_form_style}>
                                    <div> <h3>Upload files</h3></div>
                                    <div className="custom-file" >
                                        <input type="file" className="custom-file-input" id="customFile" 
                                            onChange={(e) => { 
                                                setProfilePicture(e.target.files[0])
                                                setProfilePictureName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {profile_picture_name}
                                        </label> 
                                    </div>
                                    <div className="custom-file mt-2" >
                                        <input type="file" className="custom-file-input" id="customFile" 
                                            onChange={(e) => { 
                                                setDriverLicenceDoc(e.target.files[0])
                                                setDriverLicenceDocName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {driver_licence_doc_name}
                                        </label> 
                                    </div>
                                    <div className="custom-file mt-2">
                                        <input type="file" className="custom-file-input" id="customFile"
                                            onChange={(e) => { 
                                                setCopyIdPaper(e.target.files[0])
                                                setCopyIdPaperName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {copy_id_paper_name}
                                        </label> 
                                    </div>
                                    <div className="custom-file mt-2">
                                        <input type="file" className="custom-file-input" id="customFile"
                                            onChange={(e) => { 
                                                setCopyWhitepaper(e.target.files[0])
                                                setCopyWhitepaperName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {copy_white_paper_name}
                                        </label> 
                                    </div>
                                    <div className="custom-file mt-2">
                                        <input type="file" className="custom-file-input" id="customFile"
                                            onChange={(e) => { 
                                                setCopyPublicPermit(e.target.files[0])
                                                setCopyPublicPermitName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {copy_public_permit_name}
                                        </label> 
                                    </div>
                                    <div className="custom-file mt-2">
                                        <input type="file" className="custom-file-input" id="customFile"
                                            onChange={(e) => { 
                                                setCopyBluePaper(e.target.files[0])
                                                setCopyBluePaperName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {copy_blue_paper_name}
                                        </label> 
                                    </div>
                                    <div className="form-group mt-3">
                                        <label>Blue paper expiration date: </label>
                                        <div>
                                            <DatePicker
                                                selected={blue_paper_expiration}
                                                onChange={(date) => {setBluePaperExpiration(date)}} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mt-3">
                                        <label>Driver's licence expiration date: </label>
                                        <div>
                                            <DatePicker
                                                selected={driver_licence_expiration}
                                                onChange={(date) => {setDriverLicenceExpiration(date)}} 
                                            />
                                        </div>
                                    </div>
                                    <br></br>
                                    <div style={{ marginTop: 6 }}> <h3> Bank Details</h3></div>
                                    <div className="form-group">
                                        <label>Owner name: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ owner_name_bank }
                                            onChange={(e) => { setOwnerNameBank(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Bank name: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ bank_name }
                                            onChange={(e) => { setBankName(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Account number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ account_number }
                                            onChange={(e) => { setAccountNmber(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Branch number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ branch_number }
                                            onChange={(e) => { setBranchNumber(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Branch name: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ branch_name }
                                            onChange={(e) => { setBranchName(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Account type: </label>
                                        <input type="text"
                                            className="form-control"
                                            value={ account_type }
                                            onChange={(e) => { setAccountType(e.target.value) }}
                                            />
                                    </div>

                                </div>

                                <div className="car-data" style={ car_data_style }>
                                    <div style={{ width: 550}}><h3 style={{ width: 250, margin: "auto"}}>Car's data</h3></div>
                                    <div className="form-group">
                                        <label>Brand: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ car_brand }
                                            onChange={(e) => { setCarBrand(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Permit number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ permit_number }
                                            onChange={(e) => { setPermitNumber(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Taxi number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ taxi_number }
                                            onChange={(e) => { setTaxiNumber(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Plate number: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ plate_number }
                                            onChange={(e) => { setPlateNumber(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Maximum number of passengers: </label>
                                        <input type="text"
                                            required
                                            className="form-control"
                                            value={ max_passengers }
                                            onChange={(e) => { setMaxPassengers(e.target.value) }}
                                            />
                                    </div>
                                    <div className="form-group">
                                        <label>Car category (select): </label>
                                        <select
                                            required
                                            className="form-control"
                                            style={{ width: 400 }}
                                            value={ vehicle_type }
                                            onChange={(e) => { setVehicleType(e.target.value) }}>
                             
                                        <option key="normalTaxiEconomy" value="normalTaxiEconomy">Economy (normal)</option>
                                        <option key="electricEconomy" value="electricEconomy">Economy (electric)</option>
                                        <option key="comfortNormalRide" value="comfortNormalRide">Comfort (normal)</option>
                                        <option key="comfortElectricRide" value="comfortElectricRide">Comfort (electric)</option>
                                        <option key="luxuryNormalRide" value="luxuryNormalRide">Luxury (normal)</option>
                                        <option key="luxuryElectricRide" value="luxuryElectricRide">Luxury (electric)</option>
                                        <option key="electricBikes" value="electricBikes">electricBikes</option>
                                        <option key="bikes" value="bikes">bikes</option>
                                        <option key="carDelivery" value="carDelivery">carDelivery</option>
                                        <option key="vanDelivery" value="vanDelivery">vanDelivery</option>
                                        

                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Car nature (select): </label>
                                        <select
                                            required
                                            className="form-control"
                                            style={{ width: 400 }}
                                            value={ car_nature }
                                            onChange={(e) => { setCarNature(e.target.value) }}>
                                                <option></option>
                                            <option key="bicycle" value="bicycle">bicycle</option>
                                            <option key="bike" value="bike">bike</option>
                                            <option key="car" value="car">car</option>
                                        </select>
                                    </div>
                                    <div className="custom-file mt-4">
                                        <input type="file" className="custom-file-input" id="customFile"
                                            onChange={(e) => { 
                                                setTaxiPicture(e.target.files[0])
                                                setTaxiPictureName(e.target.files[0].name)
                                            }} />
                                        <label className="custom-file-label" htmlFor="customFile">
                                            {taxi_picture_name}
                                        </label> 
                                    </div>

                                </div>

                                <div className="submit-registration">
                                <input
                                style = {{ backgroundColor: 'green'}}
                                type="submit"
                                value="Register"
                                className="btn btn-primary btn-block mt-4"
                                />
                                </div>
                            </div>
                        </form>
                    </Fragment>
                </div>
            </div>   
            </div>
        )
    
}

export default DriverRegistration