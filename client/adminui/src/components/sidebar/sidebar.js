import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { BrowserRouter as Router, Link } from 'react-router-dom'  // Keep Router though not used in code
import 'react-pro-sidebar/dist/css/styles.css';
import './sidebar.scss'
import logotaxiconnect from '../../logotaxiconnect.png'
import { FaChartBar, FaThList, FaRegRegistered, FaCarSide } from 'react-icons/fa'
import { MdBusiness } from 'react-icons/md'
import { BsFillTrashFill } from "react-icons/bs"

function Sidebar() {
     const iconStyle = {
         width: 35,
         height: 20
     }
    return(
        <div className="sidebar">
            <ProSidebar>
                <Menu iconShape="square">
                    <img src={logotaxiconnect} alt="TaxiConnect" style={{ height: 79, width: 140, marginLeft:30, marginBottom: 50}}/>
                    <MenuItem><Link to="/"><FaChartBar style={iconStyle}/>Summary</Link></MenuItem> 
                    <MenuItem><Link to="/driver-registration"><FaRegRegistered style={iconStyle} />Register Driver</Link></MenuItem>
                    
                    <SubMenu title="Trip Overview" style = {{marginLeft: 10}}>
                    <FaCarSide style={iconStyle} />
                        <SubMenu title="Windhoek" >
                            <MenuItem><Link to="/trip-overview/rides">Rides</Link></MenuItem>
                            <MenuItem><Link to="/trip-overview/deliveries">Deliveries</Link></MenuItem>
                        </SubMenu>
                        <SubMenu title="Swakopmund">
                            <MenuItem>Not Available</MenuItem>
                        </SubMenu>
                    </SubMenu>
                    <MenuItem><Link to="/cancelled-rides"><BsFillTrashFill style={iconStyle} />Misfired</Link></MenuItem>
                    <MenuItem><Link to="/drivers"><FaThList style={iconStyle} />Drivers</Link></MenuItem>
                    <MenuItem><Link to="/passengers"><FaThList style={iconStyle} />Users </Link></MenuItem>
                    <MenuItem><Link to="/driver-payment"><MdBusiness style={iconStyle} />Make payment </Link></MenuItem>
                </Menu>
            </ProSidebar>;
        </div>
    )
} 

export default Sidebar
