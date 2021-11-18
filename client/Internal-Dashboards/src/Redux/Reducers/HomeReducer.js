import { combineReducers } from "redux";
import STATE from "../Constants/State";
/**
 * Reducer responsible for all the home actions (trip booking, tracking, etc)
 * Centralized file.
 */

const INIT_STATE = STATE;

const HomeReducer = (state = INIT_STATE, action) => {
  //Predefined variables
  let newState = state;
  let tmpVar = null;

  try {
    switch (action.type) {
      case "UPDATE_SUCCESSFULL_LOGIN_DETAILS":
        //?Optimized
        if (
          action.payload !== undefined &&
          action.payload !== null &&
          action.payload.isSuspended === false &&
          action.payload.admin_fp !== undefined &&
          action.payload.admin_fp !== null
        ) {
          newState.loginData.admin_data = action.payload;
          newState.loginData.isLoggedIn = true;

          return { ...state, ...newState };
        } //No change
        else {
          newState.loginData.admin_data = null;
          newState.loginData.isLoggedIn = false;
          return { ...state, ...newState };
        }

      case "UPDATE_LATEST_ACCESS_PATT_SUSPS_IFOS":
        //! CHECK THAT THE USER SHOULD STAY IN
        if (
          (newState.loginData.admin_data === null ||
            newState.loginData.admin_data === undefined ||
            newState.loginData.admin_data.admin_fp === null ||
            newState.loginData.admin_data.admin_fp === undefined ||
            newState.loginData.admin_data.isSuspended === true ||
            newState.loginData.admin_data.isSuspended === undefined ||
            newState.loginData.admin_data.isSuspended === null) &&
          /\/$/.test(window.location.href) === false
        ) {
          //!Force log out
          newState.loginData.isLoggedIn = false;
          newState.loginData.admin_data = null;
          //...
          window.location.href = "/";
          //..
        }

        //?Optimized
        if (
          newState.loginData.admin_data !== null &&
          newState.loginData.admin_data.admin_fp !== undefined &&
          newState.loginData.admin_data.admin_fp !== null
        ) {
          if (
            `${JSON.stringify(action.payload.access_patterns)}` !==
              `${JSON.stringify(
                newState.loginData.admin_data.access_patterns
              )}` ||
            `${JSON.stringify(action.payload.isSuspended)}` !==
              `${JSON.stringify(newState.loginData.admin_data.isSuspended)}`
          ) {
            //New data received
            newState.loginData.admin_data.access_patterns =
              action.payload.access_patterns;
            newState.loginData.admin_data.isSuspended =
              action.payload.isSuspended;

            return { ...state, ...newState };
          } //No change
          else {
            return state;
          }
        } //Session probably expired
        else {
          console.log("Session probably expired.");
          return { ...state, ...newState };
        }

      case "LOG_OUT":
        newState.loginData.isLoggedIn = false;
        newState.loginData.admin_data = null;

        return { ...state, ...newState };

      case "UPDATE_OVERVIEW_DATA":
        //?Optimized with the stateHash remotely computed
        if (
          newState.overviewData === null ||
          newState.overviewData === undefined ||
          newState.overviewData.stateHash !== action.payload.stateHash
        ) {
          //New data
          newState.overviewData = action.payload;
          //..
          return { ...state, ...newState };
        } //Same data
        else {
          return state;
        }

      case "UPDATE_GLOBAL_OVERVIEW_DATA":
        //?Optimized with the stateHash remotely computed
        if (
          newState.globalOverviewData === null ||
          newState.globalOverviewData === undefined ||
          newState.globalOverviewData.stateHash !== action.payload.stateHash
        ) {
          console.log(action.payload);
          //New data
          newState.globalOverviewData = action.payload;
          //..
          return { ...state, ...newState };
        } //Same data
        else {
          return state;
        }

      case "MAKE_SURE_ACCESS_ROUTE_PERMITTED":
        //1. Get the access patterns
        tmpVar = newState.loginData.admin_data.access_patterns.split("|");

      case "UPDATE_SELECTED_DRIVER_FOR_COMM_DETAILS":
        newState.selectedDriverForCommissionDetails = action.payload;

        return { ...state, ...newState };

      case "UPDATE_SELECTED_REGION_FOR_VIEWING":
        newState.selectedRegion = action.payload;

        return { ...state, ...newState };

      case "UPDATE_STATISTICAL_BUNDLE_DATA":
        newState.statisticsBundleData = action.payload;

        return { ...state, ...newState };

      default:
        return state;
    }
  } catch (error) {
    console.log(error);
    //!Force log out
    newState.loginData.isLoggedIn = false;
    newState.loginData.admin_data = null;
    //...
    window.location.href = "/";
    //..
    return { ...state, ...newState };
  }
};

export default combineReducers({
  App: HomeReducer,
});
