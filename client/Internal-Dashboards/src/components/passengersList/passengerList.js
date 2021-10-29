import React from "react";
import { UpdateSuccessfullLoginDetails } from "../../Redux/HomeActionsCreators";
import SOCKET_CORE from "../socket";
import classes from "./passengers.module.css";
import { MdSearch, MdSupervisorAccount } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import NodeTableExplainer from "../../Helpers/NodeTableExplainer";
import Loader from "react-loader-spinner";
require("dotenv").config({ path: "../../../.env" });

class PassengerList extends React.Component {
  constructor(props) {
    super(props);

    this.SOCKET_CORE = SOCKET_CORE;

    this.intervalPersister = null;

    this.state = {
      shouldShowSearch: true, //If to show the search window or not.
      isLoading: true, //If loading or not
      usersSummaryData: {}, //Will hold the users' summary data
    };
  }

  componentDidMount() {
    let globalObject = this;

    this.getFreshSummaryData();

    //Socket io handling
    this.SOCKET_CORE.on("getPassengers-response", function (response) {
      if (
        response !== undefined &&
        response.response !== undefined &&
        response.response.total_users !== undefined
      ) {
        console.log(response);
        globalObject.setState({
          usersSummaryData: response.response,
          isLoading: false,
        });
      }
    });
  }

  //Responsible for getting the summary data
  getFreshSummaryData() {
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
          {this.state.shouldShowSearch === false ? (
            <div
              className={classes.switchView}
              onClick={() => this.setState({ shouldShowSearch: true })}
            >
              <MdSearch
                style={{ marginRight: 5, bottom: 1, position: "relative" }}
              />
              Search view
            </div>
          ) : (
            <div
              className={classes.switchView}
              onClick={() => this.setState({ shouldShowSearch: false })}
            >
              <MdSearch
                style={{ marginRight: 5, bottom: 1, position: "relative" }}
              />
              Quick look view
            </div>
          )}
        </div>
        {/* Head summary */}
        {this.state.isLoading ? (
          <div
            style={{
              // border: "1px solid black",
              width: "100%",
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader
              type="TailSpin"
              color="#000"
              height={45}
              width={45}
              timeout={300000000} //3 secs
            />
          </div>
        ) : this.state.shouldShowSearch === false ? (
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
                  value: this.state.usersSummaryData.total_users,
                },
                {
                  title: "Total male users",
                  value: this.state.usersSummaryData.total_male_users,
                },
                {
                  title: "Total female users",
                  value: this.state.usersSummaryData.total_female_users,
                },
                {
                  title: "Total unknown gender users",
                  value: this.state.usersSummaryData.total_unknown_gender_users,
                },
                {
                  title: "New users (today)",
                  value: this.state.usersSummaryData.total_new_users,
                  color: "#096ED4",
                },
                {
                  title: "Percentage active users",
                  value: this.state.usersSummaryData.percentage_active_users,
                },
              ]}
              right={[
                {
                  title: "Realtime active users",
                  value: this.state.usersSummaryData.realtime_users_online,
                  color: "#09864A",
                },
                {
                  title: "Offline users",
                  value: this.state.usersSummaryData.realtime_users_offline,
                },
                {
                  title: "TN mobile users",
                  value: this.state.usersSummaryData.tn_mobile_network_users,
                },
                {
                  title: "MTC users",
                  value: this.state.usersSummaryData.mtc_network_users,
                },
                {
                  title: "Other networks",
                  value: this.state.usersSummaryData.other_networks_users,
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
              {this.state.usersSummaryData.total_users !== undefined
                ? this.state.usersSummaryData.total_users
                : 0}{" "}
              users found
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
