import { API_RETRY_COUNT, API_RETRY_DELAY } from "../constants/constants";

/**
 * Executes an asynchronous function with exponential backoff retry.
 * @param {Function} apiCall - Async function returning a promise (or axios call)
 * @param {number} [retries=API_RETRY_COUNT] - Number of retry attempts
 * @param {number} [delay=API_RETRY_DELAY] - Initial delay in milliseconds
 * @returns {Promise<any>} The response data
 */
export const fetchWithRetry = async (
  apiCall,
  retries = API_RETRY_COUNT,
  delay = API_RETRY_DELAY
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = typeof apiCall === "function" ? await apiCall() : await apiCall;
      return response?.data !== undefined ? response.data : response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export default fetchWithRetry;
