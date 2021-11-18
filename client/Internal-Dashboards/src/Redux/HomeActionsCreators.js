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

//4.b Update the global overview data
export const UpdateGlobalOverviewData = (dataReceived) => ({
  type: "UPDATE_GLOBAL_OVERVIEW_DATA",
  payload: dataReceived,
});

//! 5. Make sure that the user is on a permitted route based on his access patterns
export const MakeSureAccessRoutePermitted = (dataReceived) => ({
  type: "MAKE_SURE_ACCESS_ROUTE_PERMITTED",
});

//6. Update the selected driver for commission details
export const UpdateSelectedDriverForCommDetails = (dataReceived) => ({
  type: "UPDATE_SELECTED_DRIVER_FOR_COMM_DETAILS",
  payload: dataReceived,
});

//7. Update the selected region for viewing
export const UpdateSelectedRegionForViewing = (dataReceived) => ({
  type: "UPDATE_SELECTED_REGION_FOR_VIEWING",
  payload: dataReceived,
});

//8. Update the statistical bundle data
export const UpdateStatisticalBundleData = (dataReceived) => ({
  type: "UPDATE_STATISTICAL_BUNDLE_DATA",
  payload: dataReceived,
});
