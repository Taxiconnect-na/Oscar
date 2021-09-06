import React, { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import socket from "../socket";
import "./Visualize.css";
import Sidebar from "../sidebar/sidebar";

export default function GrossSales() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  let [monthlyGrossSales, setMonthlyGrossSales] = useState([]);
  let [defaultyear, setDefaultYear] = useState(true);
  let [year, setYear] = useState("2021");

  useEffect(
    () => {
      // Ride counts
      socket.on("get-rides-grossSales-vis-feedback", (data) => {
        if (data !== undefined && data != null) {
          //Update cancelledRides
          setMonthlyGrossSales(data);
        }
      });
      socket.emit("get-rides-grossSales-vis", { year: year });
    },
    [
      // Empty
    ]
  );

  const changeYearHandler2020 = () => {
    if (defaultyear) {
      setYear("2020");
      setDefaultYear(false);
    }

    // Ride counts
    socket.on("get-rides-grossSales-vis-feedback", (data) => {
      if (data !== undefined && data != null) {
        //Update cancelledRides
        setMonthlyGrossSales(data);
      }
    });
    socket.emit("get-rides-grossSales-vis", { year: year });
  };

  /**
   * * Custom Styles (In line)
   */
  const styles = {
    graph: {
      margin: "3%",
      padding: "2%",
    },
  };

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    return <></>;
  } else {
    return (
      <div className="template">
        <div className="main-content" id="ride-counts">
          <h1
            className="plot-main-title"
            style={{
              display: "grid",
              placeItems: "center",
              padding: "2%",
              backgroundColor: "whitesmoke",
            }}
          >
            GROSS SALES
          </h1>
          <br></br>

          <div style={styles.graph} className="plots">
            <div className="plot">
              <h3 className="plot-title"> Monthly Gross Sales</h3>
              <BarChart
                width={500}
                height={400}
                data={monthlyGrossSales}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Processed" dataKey="successful" fill="#10659e" />
                <Bar name="Lost" dataKey="cancelled" fill="#9e0b50" />
              </BarChart>
              <button
                onClick={() => {
                  changeYearHandler2020();
                }}
                className="btn btn-info"
              >
                View 2020
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
