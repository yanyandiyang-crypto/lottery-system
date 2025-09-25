const moment = require('moment-timezone');

// Set global timezone to UTC+08:00 (Philippines/Manila)
const TIMEZONE = 'Asia/Manila';

class TimezoneUtils {
  static getTimezone() {
    return TIMEZONE;
  }

  static now() {
    return moment().tz(TIMEZONE);
  }

  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).tz(TIMEZONE).format(format);
  }

  static toTimezone(date) {
    return moment(date).tz(TIMEZONE);
  }

  static isAfterCutoff(drawTime) {
    const now = this.now();
    const cutoffTimes = {
      'twoPM': { hour: 13, minute: 55 },
      'fivePM': { hour: 16, minute: 55 },
      'ninePM': { hour: 20, minute: 55 }
    };

    const cutoff = cutoffTimes[drawTime];
    if (!cutoff) return false;

    const cutoffTime = now.clone().hour(cutoff.hour).minute(cutoff.minute).second(0);
    return now.isAfter(cutoffTime);
  }

  static getNextDrawCutoff(drawTime) {
    const now = this.now();
    const cutoffTimes = {
      'twoPM': { hour: 13, minute: 55 },
      'fivePM': { hour: 16, minute: 55 },
      'ninePM': { hour: 20, minute: 55 }
    };

    const cutoff = cutoffTimes[drawTime];
    if (!cutoff) return null;

    let cutoffTime = now.clone().hour(cutoff.hour).minute(cutoff.minute).second(0);
    
    // If cutoff has passed today, get tomorrow's cutoff
    if (now.isAfter(cutoffTime)) {
      cutoffTime = cutoffTime.add(1, 'day');
    }

    return cutoffTime;
  }

  static getDrawTimes() {
    return [
      { value: 'twoPM', label: '2:00 PM', cutoff: '13:55' },
      { value: 'fivePM', label: '5:00 PM', cutoff: '16:55' },
      { value: 'ninePM', label: '9:00 PM', cutoff: '20:55' }
    ];
  }

  static formatTicketDate(date) {
    return this.format(date, 'YYYY/MM/DD ddd HH:mm A');
  }

  static formatDrawDate(date, drawTime) {
    const timeLabels = {
      'twoPM': '14:00 FOR 2PM',
      'fivePM': '17:00 FOR 5PM', 
      'ninePM': '21:00 FOR 9PM'
    };

    // Handle undefined or invalid date
    if (!date) {
      return 'Invalid Date';
    }

    // Handle undefined or invalid drawTime
    if (!drawTime || !timeLabels[drawTime]) {
      return `${this.format(date, 'YYYY/MM/DD ddd')} - Invalid Draw Time`;
    }

    const dateStr = this.format(date, 'YYYY/MM/DD ddd');
    return `${dateStr} ${timeLabels[drawTime]} DRAW`;
  }
}

module.exports = TimezoneUtils;
