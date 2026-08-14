/**
 * Shared formatting & localization utilities across the application.
 */

/**
 * Formats a numerical value as VND currency.
 * @param {number|string} price - The price value to format
 * @param {string} [locale="vi-VN"] - Locale string
 * @returns {string} Formatted currency string or 'N/A'
 */
export const formatPrice = (price, locale = "vi-VN") => {
  const num = typeof price === "number" ? price : Number(price);
  if (isNaN(num) || price === null || price === undefined || price === "") {
    return "N/A";
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
  }).format(num);
};

/**
 * Formats a date string/timestamp into localized human-readable format.
 * @param {string|Date|number} date - Date input
 * @param {string} [locale="en-GB"] - Target locale (defaults to en-GB)
 * @param {Intl.DateTimeFormatOptions} [options] - Formatting options
 * @returns {string} Formatted date string or 'N/A'
 */
export const formatDate = (
  date,
  locale = "en-GB",
  options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(locale, options);
  } catch {
    return "N/A";
  }
};

/**
 * Formats a date string/timestamp into date-time format (DD/MM/YYYY HH:MM).
 * @param {string|Date|number} date - Date input
 * @returns {string} Formatted date-time string or 'Unknown Date'
 */
export const formatDateTime = (date) => {
  if (!date) return "Unknown Date";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Unknown Date";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "Unknown Date";
  }
};

/**
 * Formats large numbers compactly (e.g. 1.5K, 2.3M) for views, likes, reactions.
 * @param {number|string} count - Number to format
 * @param {string} [locale="en"] - Locale code
 * @returns {string} Compact number string
 */
export const formatCompactNumber = (count, locale = "en") => {
  const num = typeof count === "number" ? count : Number(count);
  if (isNaN(num) || count === null || count === undefined) return "0";
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    return String(num);
  }
};

/**
 * Formats percentage discount/voucher values.
 * @param {number|string} val - Discount percentage (e.g. 15 -> '15%')
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (val) => {
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num) || val === null || val === undefined) return "0%";
  return `${Math.round(num)}%`;
};

/**
 * Formats Vietnam phone number for clear display (e.g. 0912 345 678).
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone string
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") return phone || "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};
