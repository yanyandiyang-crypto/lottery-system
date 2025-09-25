// Utility function to format draw times consistently across the frontend
export const formatDrawTime = (drawTime) => {
  const timeLabels = {
    'twoPM': '2:00 PM',
    'fivePM': '5:00 PM', 
    'ninePM': '9:00 PM'
  };
  return timeLabels[drawTime] || drawTime || 'Unknown Time';
};

// Get short label for draw time (for display in small spaces)
export const getDrawTimeLabel = (drawTime) => {
  const shortLabels = {
    'twoPM': '2PM',
    'fivePM': '5PM',
    'ninePM': '9PM'
  };
  return shortLabels[drawTime] || drawTime || 'Unknown';
};

// Get numeric hour for draw time (for sorting/comparison)
export const getDrawTimeHour = (drawTime) => {
  const hours = {
    'twoPM': 14,   // 2:00 PM in 24-hour format
    'fivePM': 17,  // 5:00 PM in 24-hour format
    'ninePM': 21   // 9:00 PM in 24-hour format
  };
  return hours[drawTime] || 0;
};
