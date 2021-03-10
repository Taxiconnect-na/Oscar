import React, { Fragment, useState } from 'react'
//import axios from 'axios'
import socket from '../socket'
import DatePicker from 'react-datepicker'
import './driverRegistration.css'
import Sidebar from '../sidebar/sidebar'
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
        let [bank_name, setBankName] = useState('')
        let [account_number, setAccountNmber] = useState('')
        let [branch_number, setBranchNumber] = useState('')
        let [branch_name, setBranchName] = useState('')
        
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

       /* const deliveryProviderList = [
            {
                label:"ebikesForAfrica",
                value:"ebikesForAfrica"
            },
            {
                label:"deliveryGuy",
                value:"deliveryGuy"
            },
            {
                label:"twoPointDelivery",
                value:"twoPointDelivery"
            }
        ] */

        const onSubmit = async (e) => {
            e.preventDefault()
            // Crete a formData to contain all submitted information
            const formData = new FormData()
            formData.append('name', name)
            formData.append('surname', surname)
            formData.append('title', title)
            formData.append('personal_id_number', personal_id_number)
            formData.append('phone_number', phone_number)
            formData.append('email', email)
            //formData.append('password', password)
            formData.append('operation_clearances', operation_clearances)
            formData.append('delivery_provider', delivery_provider)

            if (formData.get('operation_clearances') === "Ride") {
                formData.set('delivery_provider', "")
            }

            formData.append('profile_picture', profile_picture)
            formData.append('driver_licence_doc', driver_licence_doc)
            formData.append('copy_id_paper', copy_id_paper)
            formData.append('copy_white_paper', copy_white_paper)
            formData.append('copy_public_permit', copy_public_permit)
            formData.append('copy_blue_paper', copy_blue_paper)
            formData.append('blue_paper_expiration', blue_paper_expiration)
            formData.append('driver_licence_expiration', driver_licence_expiration)
            formData.append('bank_name', bank_name)
            formData.append('account_number', account_number)
            formData.append('branch_number', branch_number)
            formData.append('branch_name', branch_name)

            // Car's data
            formData.append('car_brand', car_brand)
            formData.append('permit_number', permit_number)
            formData.append('taxi_number', taxi_number)
            formData.append('plate_number', plate_number)
            formData.append('max_passengers', max_passengers)
            formData.append('taxi_picture', taxi_picture)
            formData.append('vehicle_type', vehicle_type)
            formData.append('car_nature', car_nature)
           
            console.log(formData.get('title'))
            console.log(formData.get('delivery_provider'))
            console.log(formData.get('operation_clearances'))
            console.log(formData.get('copy_id_paper'))
            //passenger-data
            // Send data to server
            try {
                /*
                * local setup
                const res = await axios.post(`http://localhost:10011/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    } 
                })
                    */
                //*production:
                /*
                const res = await axios.post(`http://taxiconnectna.com:10011/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    } 
                })
            
                console.log(res.data)
                alert("Successfully submitted") */
                socket.emit("registerDriver", formData)
              
                 /* socket.on("authenticate-response", (data) => {
                    if (data.authenticated) {
                      //  Upon successful authentication:
                      setAuthentication(true);
                      setName(details.name);
                      setEmail(details.email);
                      setPassword(details.password); */
                socket.on("registerDriver-response", (data) => {
                    console.log(data)

                    // Basic pages style
                    const errorStyle = {
                        color: "red",
                        width: 150,
                        margin: "auto"
                    }
                    const successStyle = {
                        color: "green",
                        width: 150,
                        margin: "auto"
                    }

                    // Return success or Error page:
                    if (data.error) {

                        return (
                            <div className="container">
                                <h1 style={errorStyle}> An error occured at the server</h1>
                            </div>
                        )
                    } else {
                        console.log(data)
                        return (
                            <div className="container">
                                <h1 style={successStyle}> Driver Successfully registered</h1>
                            </div>
                        )
                    }
                })
                
            } catch(err) {
                console.log(err)
                const errorStyle = {
                    color: "red",
                    width: 150,
                    margin: "auto"
                }
                //alert("There was an error with the server" )
                return (
                    <div className="container">
                        <h1 style={errorStyle}> An error occured at the server</h1>
                    </div>
                )
            }   
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
                                            <option></option>
                                    <option key="normalTaxiEconomy" value="normalTaxiEconomy">Economy (normal)</option>
                                    <option key="electricEconomy" value="electricEconomy">Economy (electric)</option>
                                    <option key="comfortNormalRide" value="comfortNormalRide">Comfort (normal)</option>
                                    <option key="comfortElectricRide" value="comfortElectricRide">Comfort (electric)</option>
                                    <option key="luxuryNormalRide" value="luxuryNormalRide">Luxury (normal)</option>
                                    <option key="luxuryElectricRide" value="luxuryElectricRide">Luxury (electric)</option>

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