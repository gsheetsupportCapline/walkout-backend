const moment = require("moment-timezone");

const CST_TIMEZONE = "America/Chicago";
const CST_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * Convert given date/time to CST (America/Chicago) and return a Date object.
 * @param {Date|string|number} date - Input date (default: now)
 * @returns {Date}
 */
const toCSTDate = (date = new Date()) => {
  return moment(date).tz(CST_TIMEZONE).toDate();
};

/**
 * Convert given date/time to CST string (YYYY-MM-DD HH:mm:ss).
 * @param {Date|string|number} date - Input date (default: now)
 * @returns {string}
 */
const toCSTDateString = (date = new Date()) => {
  return moment(date).tz(CST_TIMEZONE).format(CST_DATETIME_FORMAT);
};

/**
 * Parse CST string (YYYY-MM-DD HH:mm:ss) into Date object.
 * @param {string} dateString
 * @returns {Date}
 */
const parseCSTDateString = (dateString) => {
  return moment.tz(dateString, CST_DATETIME_FORMAT, CST_TIMEZONE).toDate();
};

module.exports = {
  CST_TIMEZONE,
  CST_DATETIME_FORMAT,
  toCSTDate,
  toCSTDateString,
  parseCSTDateString,
};
