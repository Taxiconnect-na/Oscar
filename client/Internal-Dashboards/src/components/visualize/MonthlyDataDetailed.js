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

export default function MonthlyDataDetailed() {
  const App = useSelector((state) => ({ App: state.App }), shallowEqual);
  const dispatch = useDispatch();

  if (
    App.App.loginData.admin_data === null ||
    App.App.loginData.admin_data === undefined
  ) {
    window.location.href = "/";
  }

  let [monthlyData, setmonthlyData] = useState([]);
  let [defaultyear, setDefaultYear] = useState(true);
  let [year, setYear] = useState("");
  let [monthNumber, setMonthNumber] = useState("");
  let [loading, setLoading] = useState(false);

  useEffect(
    () => {
      ("Visualizing daily data per month");
    },
    [
      // Empty
    ]
  );

  const getMonthlyDataHandler = (e) => {
    e.preventDefault();
    setLoading(true);
    if (year.length > 0 && monthNumber.length > 0) {
      socket.on("get-monthly-per-day-rides-data-feedback", (data) => {
        if (data !== undefined && data != null) {
          //Update cancelledRides
          setLoading(false);
          //(data)
          setmonthlyData(data);
        }
      });
      socket.emit("get-monthly-per-day-rides-data", {
        year: year,
        monthNumber: monthNumber,
      });
    } else {
      alert("Wrong input");
    }
  };

  const state_style = {
    loading: {
      display: "grid",
      placeItems: "center",
      margin: "5%",
      color: "black",
    },
  };
  let state;
  if (loading) {
    state = <h4 style={state_style.loading}> Fetching data...</h4>;
  }

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
            DAILY DATA
          </h1>
          <br></br>
          <div
            style={{
              backgroundColor: "#0a1421",
              margin: "1%",
              padding: "2%",
              color: "white",
            }}
          >
            <form
              onSubmit={getMonthlyDataHandler}
              style={{ display: "grid", placeItems: "center" }}
            >
              <div className="form-group ml-4">
                <label>Select Year: </label>
                <select
                  required
                  className="form-control "
                  style={{ width: 350 }}
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                  }}
                >
                  <option></option>
                  <option key="2021" value="2021">
                    2021
                  </option>
                  <option key="2020" value="2020">
                    2020
                  </option>
                </select>
              </div>
              <div className="form-group ml-4">
                <label> Select Month: </label>
                <select
                  required
                  className="form-control "
                  style={{ width: 350 }}
                  value={monthNumber}
                  onChange={(e) => {
                    setMonthNumber(e.target.value);
                  }}
                >
                  <option></option>
                  <option key="1" value="1">
                    January
                  </option>
                  <option key="2" value="2">
                    February
                  </option>
                  <option key="3" value="3">
                    March
                  </option>
                  <option key="4" value="4">
                    April
                  </option>
                  <option key="5" value="5">
                    May
                  </option>
                  <option key="6" value="6">
                    June
                  </option>
                  <option key="7" value="7">
                    July
                  </option>
                  <option key="8" value="8">
                    August
                  </option>
                  <option key="9" value="9">
                    September
                  </option>
                  <option key="10" value="10">
                    October
                  </option>
                  <option key="11" value="11">
                    November
                  </option>
                  <option key="12" value="12">
                    December
                  </option>
                </select>
              </div>
              <div>
                <input
                  style={{
                    backgroundColor: "#303842",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                  }}
                  type="submit"
                  value="Fetch"
                  className="btn btn-primary btn-block mt-4"
                />
              </div>
            </form>
          </div>

          {monthlyData.length > 0 ? (
            <div style={styles.graph} className="plots">
              <div className="plot">
                <h3 className="plot-title"> Rides </h3>
                <BarChart
                  width={900}
                  height={550}
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    name="Successful"
                    dataKey="successful_rides_count"
                    fill="#10659e"
                  />
                  <Bar
                    name="Cancelled"
                    dataKey="cancelled_rides_count"
                    fill="#9e0b50"
                  />
                </BarChart>
              </div>

              <div className="plot">
                <h3 className="plot-title"> Sales [N$] </h3>
                <BarChart
                  width={900}
                  height={550}
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    name="Successful"
                    dataKey="total_sales_successful"
                    fill="#076605"
                  />
                  <Bar
                    name="Lost "
                    dataKey="total_sales_cancelled"
                    fill="#800000"
                  />
                </BarChart>
              </div>
            </div>
          ) : !loading ? (
            <h1 style={{ display: "grid", placeItems: "center", margin: "4%" }}>
              {" "}
              No data Available, fetch with valid year and month.{" "}
            </h1>
          ) : (
            state
          )}
        </div>
      </div>
    );
  }
}
