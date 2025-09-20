const moment = require('moment-timezone');

const PHILIPPINES_TIMEZONE = 'Asia/Manila';

class PhilippineTime {
  static now() {
    return moment().tz(PHILIPPINES_TIMEZONE).toDate();
  }

  static toPhilippineTime(date) {
    return moment(date).tz(PHILIPPINES_TIMEZONE).toDate();
  }

  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).tz(PHILIPPINES_TIMEZONE).format(format);
  }

  static startOfDay(date = null) {
    const targetDate = date || this.now();
    return moment(targetDate).tz(PHILIPPINES_TIMEZONE).startOf('day').toDate();
  }

  static endOfDay(date = null) {
    const targetDate = date || this.now();
    return moment(targetDate).tz(PHILIPPINES_TIMEZONE).endOf('day').toDate();
  }

  static addHours(date, hours) {
    return moment(date).tz(PHILIPPINES_TIMEZONE).add(hours, 'hours').toDate();
  }

  static addDays(date, days) {
    return moment(date).tz(PHILIPPINES_TIMEZONE).add(days, 'days').toDate();
  }

  static isSameDay(date1, date2) {
    return moment(date1).tz(PHILIPPINES_TIMEZONE).isSame(moment(date2).tz(PHILIPPINES_TIMEZONE), 'day');
  }

  static getTimezone() {
    return PHILIPPINES_TIMEZONE;
  }
}

module.exports = PhilippineTime;
