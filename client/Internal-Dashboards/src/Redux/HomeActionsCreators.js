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
