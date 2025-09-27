// Test timezone handling

console.log('🕐 Testing timezone handling...\n');

// Current time in different formats
const now = new Date();
console.log('🌍 Current UTC time:', now.toISOString());
console.log('🌍 Current local time:', now.toString());

// Philippines timezone (UTC+8)
const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
console.log('🇵🇭 Philippines time:', phTime.toISOString());

// Date strings
const utcDateString = now.toISOString().split('T')[0];
const phDateString = phTime.toISOString().split('T')[0];

console.log('\n📅 Date strings:');
console.log('UTC date:', utcDateString);
console.log('PH date:', phDateString);

// Check if dates are different
if (utcDateString !== phDateString) {
  console.log('\n⚠️  TIMEZONE ISSUE DETECTED!');
  console.log('UTC and Philippines dates are different');
  console.log('This explains why calendar shows wrong date after midnight');
} else {
  console.log('\n✅ Dates match - no timezone issue at this time');
}

// Show current hour in both timezones
const utcHour = now.getUTCHours();
const phHour = phTime.getUTCHours();

console.log('\n🕐 Current hours:');
console.log(`UTC hour: ${utcHour}`);
console.log(`PH hour: ${phHour}`);

// Explain the issue
console.log('\n💡 Explanation:');
console.log('- Backend uses Asia/Manila timezone correctly');
console.log('- Frontend was using UTC timezone for date initialization');
console.log('- After midnight PH time, UTC is still previous day');
console.log('- This causes calendar to show wrong date');
console.log('\n🔧 Fix applied:');
console.log('- Created dateUtils.js with PH timezone functions');
console.log('- Updated Dashboard to use getCurrentDatePH()');
console.log('- Now frontend and backend use same timezone');

console.log('\n🎯 Test completed!');
