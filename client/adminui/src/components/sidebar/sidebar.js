import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { BrowserRouter as Router, Link } from 'react-router-dom'  // Keep Router though not used in code
import 'react-pro-sidebar/dist/css/styles.css';
import './sidebar.scss'
 
function Sidebar() {
     
    return(
        <div className="sidebar">
            <ProSidebar>
                <Menu iconShape="square">
                    <MenuItem><Link to="/">Summary</Link></MenuItem> 
                    <MenuItem><Link to="/driver-registration">Register Driver</Link></MenuItem>
                    <SubMenu title="Trip Overview">
                        <SubMenu title="Windhoek" >
                            <MenuItem><Link to="/trip-overview/rides">Rides</Link></MenuItem>
                            <MenuItem><Link to="/trip-overview/deliveries">Deliveries</Link></MenuItem>
                        </SubMenu>
                        <SubMenu title="Swakopmund">
                            <MenuItem>Not Available</MenuItem>
                        </SubMenu>
                    </SubMenu>
                    <MenuItem><Link to="/drivers">Drivers</Link></MenuItem>
                    <MenuItem><Link>Users </Link></MenuItem>
                </Menu>
            </ProSidebar>;
        </div>
    )
} 

export default Sidebar
