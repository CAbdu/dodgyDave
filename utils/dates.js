function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getDateNDaysAgo(n) {
    const now = new Date(); // current date and time
    now.setDate(now.getDate() - n); // subtract n days
    return formatDate(now);
}

// Get the most recent trading day (excluding weekends)
function getLastTradingDay() {
    const now = new Date();
    const day = now.getDay();
    
    // If it's Sunday (0) or Saturday (6), go back to Friday
    if (day === 0) {
        now.setDate(now.getDate() - 2);
    } else if (day === 6) {
        now.setDate(now.getDate() - 1);
    }
    
    return formatDate(now);
}

export const dates = {
    startDate: getDateNDaysAgo(7), // Go back 7 days to ensure we get enough trading days
    endDate: getLastTradingDay() // Get the most recent trading day
}