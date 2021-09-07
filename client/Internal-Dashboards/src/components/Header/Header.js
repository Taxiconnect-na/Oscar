import React from "react";
import classes from "./Header.module.css";
import logotaxiconnect from "../../Assets/logo_white.png";
import { AiOutlineUser, AiOutlineCaretDown } from "react-icons/ai";

class Header extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={classes.mainContainer}>
        <div className={classes.logoContainer}>
          <img alt="logo" src={logotaxiconnect} className={classes.trueLogo} />
        </div>
        <div></div>
        <div className={classes.rightContainer}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <div
              style={{
                border: "1px solid #fff",
                width: 30,
                height: 30,
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
              }}
            >
              <AiOutlineUser
                style={{ width: 20, height: 20, color: "#0e8491" }}
              />
            </div>
            <AiOutlineCaretDown
              style={{ color: "#fff", width: 10, height: 10, marginLeft: 10 }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
