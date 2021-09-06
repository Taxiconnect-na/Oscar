import React from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import { AiOutlineCheckSquare } from "react-icons/ai";
import { FaRegSmileBeam } from "react-icons/fa";
import "./success.css";

export default function SuccessPage() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  const style = {
    color: "green",
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
      <div className="success-page-body">
        <div style={style}>
          <h1>
            <AiOutlineCheckSquare
              style={{ width: 50, height: 50, color: "green" }}
            />
            Successfully Completed <br></br>
            <FaRegSmileBeam
              style={{ width: 60, height: 60, color: "green", margin: 9 }}
            />
          </h1>

          <button className="btn btn-success" onClick={() => GoHome()}>
            Go back
          </button>
        </div>
      </div>
    );
  }
}
