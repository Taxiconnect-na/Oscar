import React from "react";
import classes from "./Error.module.css";
import { AiOutlineStop } from "react-icons/ai";

class NotPermitted extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <div className={classes.errorContainer}>
          <div style={{ marginBottom: 20 }}>
            <AiOutlineStop
              style={{ width: 55, height: 55, color: "#b22222" }}
            />
          </div>
          <div className={classes.textWarning}>
            You do not have permission to be here, stay within your authorized
            pages (
            <strong style={{ fontFamily: "MoveTextMedium" }}>
              the menu on your left
            </strong>
            ), please contact your system administrator if it's a mistake or
            just leave.
          </div>
          <div className={classes.textWarningW}>
            Any persistent visit to restricted pages will ultimately result in
            the suspension of your account.
          </div>
        </div>
        <div className={classes.copyright}>
          TaxiConnect 2020. All rights reserved.
        </div>
      </>
    );
  }
}

export default NotPermitted;
