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
        `${JSON.stringify(action.payload.access_patterns)}` !==
          `${JSON.stringify(newState.loginData.admin_data.access_patterns)}` ||
        `${JSON.stringify(action.payload.isSuspended)}` !==
          `${JSON.stringify(newState.loginData.admin_data.isSuspended)}`
      ) {
        //New data received
        newState.loginData.admin_data.access_patterns =
          action.payload.access_patterns;
        newState.loginData.admin_data.isSuspended = action.payload.isSuspended;

        return { ...state, ...newState };
      } //No change
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
