import React from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import { VscError } from "react-icons/vsc";
import classes from "./Error.module.css";

export default function ErrorPage() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  const style = {
    color: "red",
    margin: "auto",
    width: "70%",
    textAlign: "center",
    padding: "3%",
  };

  const GoHome = () => {
    window.location = "/driver-registration";
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    return (
      <div className={classes.error_page_body}>
        <div style={style}>
          <h1>
            <VscError style={{ width: 50, height: 50, color: "red" }} />
            Action not completed <br></br>
          </h1>

          <button className="btn btn-primary" onClick={() => GoHome()}>
            Go back
          </button>
        </div>
      </div>
    );
  }
}
