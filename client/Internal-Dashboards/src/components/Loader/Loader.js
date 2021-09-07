import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import socket from "../socket";
import SuccessPage from "../successPage/SuccessPage";
import ErrorPage from "../errorPage/ErrorPage";
import logotaxiconnect from "../../Assets/logotaxiconnect.png";
import "./Loader.css";
import { VscLoading } from "react-icons/vsc";

export default function Loader() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  let [name, setName] = useState("");
  let [uploading, setUploading] = useState(false);
  let [success, setSuccess] = useState(false);
  let [failure, setFailure] = useState(false);

  const onClickHandler = () => {
    window.location = "/drivers";
  };

  const sendRequest = () => {
    setUploading(true);

    socket.on("socket-test-response", (data) => {
      if (data !== undefined && data != null) {
        if (data.success) {
          setUploading(false);
          setSuccess(true);
        } else if (data.failure) {
          setUploading(false);
          setFailure(true);
        }
      } else {
        setUploading(false);
        setFailure(true);
      }
    });
    socket.emit("socket-test", { message: "testing socket" });
  };

  const style = {
    Width: "100px",
    margin: "auto",
    padding: "5%",
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    if (uploading) {
      return (
        <div className="uploading">
          <VscLoading
            style={{
              width: 120,
              height: 120,
              marginTop: "5%",
              backgroundColor: "#16a0db",
            }}
            className="rotate"
          />
          <img
            src={logotaxiconnect}
            alt="Loading..."
            style={{ width: "15%" }}
          />
        </div>
      );
    } else if (success) {
      return <SuccessPage />;
    } else if (failure) {
      return <ErrorPage />;
    }

    return (
      <div>
        <div style={style}>
          <button
            className="btn btn-success"
            style={{ padding: "10px" }}
            onClick={() => {
              sendRequest();
            }}
          >
            Send request
          </button>{" "}
          <br></br>
          <button
            className="btn btn-info"
            onClick={() => {
              onClickHandler();
            }}
          >
            {" "}
            Click me
          </button>
          <br></br>
          <VscLoading
            style={{
              width: 120,
              height: 120,
              marginTop: "5%",
              color: "#16a0db",
            }}
            className="rotate"
          />
          <img
            src={logotaxiconnect}
            alt="Loading..."
            style={{ width: "10%", marginLeft: "35%" }}
            className="roate"
          />
        </div>
      </div>
    );
  }
}
