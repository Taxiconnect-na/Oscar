import React from "react";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import SOCKET_CORE from "../socket";
import classes from "./passengers.module.css";
import { MdSearch, MdSupervisorAccount } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import NodeTableExplainer from "../../Helpers/NodeTableExplainer";
require("dotenv").config({ path: "../../../.env" });

class PassengerList extends React.Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      shouldShowSearch: false, //If to show the search window or not.
      isLoading: false, //If loading or not
      usersSummaryData: {}, //Will hold the users' summary data
    };
  }

  componentDidMount() {
    let globalObject = this;

    this.getFreshSummaryData();

    //Socket io handling
    this.SOCKET_CORE.emit("getPassengers-response", function (response) {
      if (
        response !== undefined &&
        response.response !== undefined &&
        response.response.total_users !== undefined
      ) {
        console.log(response);
        globalObject.setState({ usersSummaryData: response.response });
      }
    });
  }

  //Responsible for getting the summary data
  getFreshSummaryData() {
    let globalObject = this;
    //...
    this.SOCKET_CORE.emit("getPassengers", {
      lookup: "summary",
    });
  }

  render() {
    return (
      <div
        style={{
          padding: "10px",
          marginTop: "10px",
          overflowX: "hidden",
        }}
      >
        <div className={classes.headerGeneric}>
          <div>Registered users</div>
          <div className={classes.switchView}>
            <MdSearch
              style={{ marginRight: 5, bottom: 1, position: "relative" }}
            />
            Search view
          </div>
        </div>
        {/* Head summary */}
        {this.state.shouldShowSearch === false ? (
          <div
            className={classes.globalNumbersContainer}
            style={{ marginTop: 20 }}
          >
            <div className={classes.headerGBNumbers}>Quick look</div>
            <NodeTableExplainer
              title=""
              left={[
                {
                  title: "Total users",
                  value: 0,
                },
                {
                  title: "Total male users",
                  value: 0,
                },
                {
                  title: "Total female users",
                  value: 0,
                },
                {
                  title: "New users (today)",
                  value: 0,
                },
                {
                  title: "Percentage active users",
                  value: 0,
                },
              ]}
              right={[
                {
                  title: "Realtime active users",
                  value: 0,
                },
                {
                  title: "TN mobile users",
                  value: 0,
                },
                {
                  title: "MTC users",
                  value: 0,
                },
                {
                  title: "Other networks",
                  value: 0,
                },
              ]}
            />
          </div>
        ) : (
          <div className={classes.searchWindow}>
            {/* Search bar */}
            <div className={classes.searchBar}>
              <div className={classes.inputContainer}>
                <input
                  type="text"
                  placeholder="Enter the user's gender here"
                  style={{ backgroundColor: "#fff" }}
                  className={classes.inputSearch}
                />
              </div>
              <div className={classes.selectContainer}>
                <select className={classes.selectCriteria}>
                  <option value="latest">Latest</option>
                  <option value="name">Name</option>
                  <option value="surname">Surname</option>
                  <option value="gender">Gender</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="date_signedup">Date signed up</option>
                </select>
              </div>
              <div className={classes.searchIconContainer}>
                <FiArrowRight
                  style={{ width: 25, height: 25, color: "#fff" }}
                />
              </div>
            </div>
            {/* Number of users found */}
            <div className={classes.usersFoundContainer}>
              <MdSupervisorAccount
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 4,
                  position: "relative",
                  bottom: 1,
                }}
              />{" "}
              12 users found
            </div>
            {/* Results container */}
            <div className={classes.resultsContainer}>results</div>
          </div>
        )}
      </div>
    );
  }
}

export default PassengerList;
