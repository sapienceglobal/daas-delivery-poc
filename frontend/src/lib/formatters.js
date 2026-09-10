// currency, Date, and Time formatters that adapt to Merchant Settings

/**
 * Formats an amount based on the merchant's currency setting.
 * @param {number} amount - The numeric amount to format.
 * @param {string} currencySetting - The currency setting string (e.g. "USD ($) - US Dollar", "EUR (€) - Euro", "INR (₹) - Indian Rupee")
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, currencySetting) => {
  const numAmount = Number(amount) || 0;
  let code = 'USD'; // default
  
  if (currencySetting) {
    if (currencySetting.includes('EUR')) code = 'EUR';
    else if (currencySetting.includes('INR')) code = 'INR';
    else if (currencySetting.includes('GBP')) code = 'GBP';
    // ... add more if needed
  }

  return numAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// maps the settings timezone string to an IANA timezone identifier
export const mapTimezone = (timezoneStr) => {
  if (!timezoneStr) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezoneStr.includes('Eastern Time') || timezoneStr.includes('UTC-05:00') || timezoneStr.includes('UTC-5:00') || timezoneStr.includes('UTC-04:00') || timezoneStr.includes('UTC-4:00')) return 'America/New_York';
  if (timezoneStr.includes('Pacific Time') || timezoneStr.includes('UTC-08:00') || timezoneStr.includes('UTC-8:00')) return 'America/Los_Angeles';
  if (timezoneStr.includes('Indian Standard Time') || timezoneStr.includes('UTC+05:30') || timezoneStr.includes('UTC+5:30')) return 'Asia/Kolkata';
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// formats a date object/string based on merchant settings
export const formatDate = (dateValue, dateFormat = 'MM/DD/YYYY', timezone = null) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const tz = mapTimezone(timezone);

  const options = {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  const yyyy = parts.find(p => p.type === 'year').value;

  if (dateFormat === 'DD/MM/YYYY') {
    return `${dd}/${mm}/${yyyy}`;
  }
  return `${mm}/${dd}/${yyyy}`;
};

// formats a time object/string based on merchant settings
export const formatTime = (dateValue, timeFormat = '12 Hour (AM/PM)', timezone = null) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const tz = mapTimezone(timezone);

  const options = {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12 Hour (AM/PM)'
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatDateTime = (dateValue, dateFormat, timeFormat, timezone) => {
  return `${formatDate(dateValue, dateFormat, timezone)} • ${formatTime(dateValue, timeFormat, timezone)}`;
};

export const getCurrentDayIndex = (timezoneStr) => {
  const tz = mapTimezone(timezoneStr);
  const dateInTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  return dateInTz.getDay(); // 0 (Sunday) to 6 (Saturday)
};

export const getTimezoneAbbr = (timezoneStr) => {
  const tz = mapTimezone(timezoneStr);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
  const tzName = parts.find(p => p.type === 'timeZoneName');
  return tzName ? tzName.value : '';
};

export const isRestaurantOpenNow = (operatingHours, timezoneStr) => {
  if (!operatingHours) return false;
  const tz = mapTimezone(timezoneStr);
  
  const now = new Date();
  const dateInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = daysOfWeek[dateInTz.getDay()];
  
  const todayHours = operatingHours[todayName];
  if (!todayHours || todayHours.isClosed || !todayHours.open || !todayHours.close) {
    return false;
  }
  
  const currentHour = String(dateInTz.getHours()).padStart(2, '0');
  const currentMinute = String(dateInTz.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  
  if (todayHours.close < todayHours.open) {
    // overnight hours (e.g. 20:00 to 02:00)
    return currentTime >= todayHours.open || currentTime <= todayHours.close;
  }
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};
