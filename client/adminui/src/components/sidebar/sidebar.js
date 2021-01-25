import { ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { Link } from 'react-router-dom'
import 'react-pro-sidebar/dist/css/styles.css';
import './sidebar.scss'
 
function Sidebar() {
     
    return(
        <div className="sidebar">
            <ProSidebar>
                <Menu iconShape="square">
                    
                    <Link to="/summary" > <MenuItem>Summary</MenuItem> </Link>
                    <Link to="/driver-registration"><MenuItem>Register Driver </MenuItem> </Link>
                    <MenuItem>Drivers</MenuItem>
                    <MenuItem>Users</MenuItem>
                    
                </Menu>
            </ProSidebar>;
        </div>
    )
}

export default Sidebar
