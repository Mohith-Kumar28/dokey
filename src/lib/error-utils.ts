/**
 * Extracts a user-friendly error message from various API error formats
 * @param error - The error object from API calls
 * @param fallbackMessage - Default message if no specific error message is found
 * @returns A user-friendly error message string
 */
export function getErrorMessage(
  error: any,
  fallbackMessage = 'An error occurred'
): string {
  // Handle null/undefined
  if (!error) return fallbackMessage;

  // If error is already a string
  if (typeof error === 'string') return error;

  // Check for axios/fetch error response formats
  // Format 1: error.response.data.error (most common in our API)
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Format 2: error.response.data.message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Format 3: error.response.data as string
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  // Format 4: error.data.error (React Query format)
  if (error?.data?.error) {
    return error.data.error;
  }

  // Format 5: error.data.message
  if (error?.data?.message) {
    return error.data.message;
  }

  // Format 6: Direct error.error property
  if (error?.error && typeof error.error === 'string') {
    return error.error;
  }

  // Format 7: error.message (standard Error object)
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Format 8: Network errors
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your connection.';
  }

  // Debug: log the error structure if we couldn't extract a message
  console.error(
    '[getErrorMessage] Could not extract error message from:',
    error
  );

  // Return fallback message
  return fallbackMessage;
}
