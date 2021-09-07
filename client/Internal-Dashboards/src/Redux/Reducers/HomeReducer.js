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
      //?Optimized
      if (
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
        return state;
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
    default:
      return state;
  }
};

export default combineReducers({
  App: HomeReducer,
});
