import React from 'react'
import { useAuth0 } from "@auth0/auth0-react"

// Component to be rendered by a protected route since user is null if there;s no authenticated user
const Profile = () => {
    const { user } = useAuth0()
    const { name, picture } = user
    // Available user: { JSON.stringify(user, null, 2)}
    const nameStyle = {
        fontSize: 18
    }
  return (
    <div>
      <div> Logged in as <span style={nameStyle}><strong>{ name }</strong></span><br></br> </div>  
    </div>
  )
}

export default Profile
