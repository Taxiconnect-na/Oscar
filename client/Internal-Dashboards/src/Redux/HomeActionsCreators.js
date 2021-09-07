/**
 * ACTIONS CREATORS FOR MAINLY HOME GLOBAL STATE
 * This file maps all the actions mainly targeting the home screen, but can also
 * include other screens actions.
 * For actions without a specific payload, defaults the payload to - true.
 */

//1. Update the login details only when successfull
export const UpdateSuccessfullLoginDetails = (dataReceived) => ({
  type: "UPDATE_SUCCESSFULL_LOGIN_DETAILS",
  payload: dataReceived,
});

//2. Update the latest access patterns and suspensions infos
export const UpdateLatestAccessPatternsAndSuspInfos = (dataReceived) => ({
  type: "UPDATE_LATEST_ACCESS_PATT_SUSPS_IFOS",
  payload: dataReceived,
});

//3. Log out
export const LogOut = () => ({
  type: "LOG_OUT",
});

//4. Update the overview data
export const UpdateOverviewData = (dataReceived) => ({
  type: "UPDATE_OVERVIEW_DATA",
  payload: dataReceived,
});
