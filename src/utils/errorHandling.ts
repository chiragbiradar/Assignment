/**
 * Utility functions for error handling
 */

/**
 * Format a Supabase error for logging
 * @param error The error object from Supabase
 * @returns A formatted string representation of the error
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Unknown error';
  
  try {
    // If it's a standard Error object
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    
    // If it's a Supabase error object with code and message
    if (error.code && error.message) {
      return `[${error.code}] ${error.message}`;
    }
    
    // If it's a Supabase error object with details
    if (error.details) {
      return `${error.message || 'Error'}: ${JSON.stringify(error.details)}`;
    }
    
    // If it's a plain object, stringify it
    if (typeof error === 'object') {
      return JSON.stringify(error);
    }
    
    // Default case
    return String(error);
  } catch (e) {
    return 'Error formatting error message';
  }
}

/**
 * Handle a Supabase error with proper logging and optional fallback
 * @param error The error object from Supabase
 * @param context A string describing where the error occurred
 * @param fallbackFn Optional function to call for fallback behavior
 */
export function handleSupabaseError(error: any, context: string, fallbackFn?: () => void): void {
  const formattedError = formatSupabaseError(error);
  console.error(`${context}: ${formattedError}`);
  
  // If a fallback function is provided, call it
  if (fallbackFn) {
    try {
      fallbackFn();
    } catch (fallbackError) {
      console.error(`Error in fallback function: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}
