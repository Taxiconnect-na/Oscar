const { logger } = require("../LogService");

function SumFareField(object) {
  const Sum = (arr) => arr.reduce((num1, num2) => num1 + num2, 0); // The sum function
  //Initialize array
  let finalArray = object.map((each) => {
    return each.fare;
  });

  return Sum(finalArray);
}

/**
 *
 * @param {list} data : Data generated from GeneralPlottingData
 * @param {string} year
 * @param {string} monthNumber
 * @returns
 */
function getRidesMonthDetailedData(data, year, monthNumber) {
  return new Promise((resolve, reject) => {
    let filtered_data = data.filter((data) => {
      return data.yearMonth === `${year}-${monthNumber}`;
    });

    logger.info(filtered_data.length);

    let filtered_data_grouped = filtered_data.groupBy("dayNumber");

    let new_filtered_data = filtered_data_grouped.map((day) => {
      return new Promise((res) => {
        res({
          year: year,
          month: monthNumber,
          day: day.field,
          successful_rides_count: day.groupList.filter((data) => {
            return data.ride_state === "successful";
          }).length,
          cancelled_rides_count: day.groupList.filter((data) => {
            return data.ride_state === "cancelled";
          }).length,
          total_sales_successful: SumFareField(
            day.groupList.filter((data) => {
              return data.ride_state === "successful";
            })
          ),
          total_sales_cancelled: SumFareField(
            day.groupList.filter((data) => {
              return data.ride_state === "cancelled";
            })
          ),
        });
      });
    });

    Promise.all(new_filtered_data)
      .then((outcome) => {
        resolve(outcome);
      })
      .catch((error) => {
        logger.info(error);
        reject({ error: true });
      });
    //logger.info(filtered_data_grouped[0].groupList.filter((data) => { return data.ride_state==="successful"}))
  });
}

/**
 * *======================================
 * *    LIST OF EXPORTED FUNCTIONS
 * *======================================
 */
exports.getRidesMonthDetailedData = getRidesMonthDetailedData;
