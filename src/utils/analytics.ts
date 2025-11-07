// utils/analytics.ts
declare global {
  interface Window {
    // FIX 1: Replaced 'any[]' with 'unknown[]'
    // This is safer as it forces type-checking, but still flexible.
    gtag?: (...args: unknown[]) => void;
  }
}

// Type-safe event tracking
export const trackEvent = (
  eventName: string,
  // FIX 2: Replaced 'any' with a more specific type for GA parameters
  parameters?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Specific event functions for your app
export const analytics = {
  // When someone uploads an image
  imageUploaded: (fileType: string, fileSizeMB: number) => {
    trackEvent('image_uploaded', {
      file_type: fileType,
      file_size_mb: fileSizeMB,
    });
  },

  // When analysis completes
  analysisCompleted: (issuesFound: number, processingTime: number) => {
    trackEvent('analysis_completed', {
      issues_found: issuesFound,
      result: issuesFound > 0 ? 'failed' : 'passed',
      processing_time_seconds: processingTime,
    });
  },

  // When user views results
  resultsViewed: (issuesPresent: boolean) => {
    trackEvent('results_viewed', {
      // 'boolean' is included in our new type, so this is valid
      issues_present: issuesPresent, 
    });
  },

  // Track where users drop off
  userDroppedOff: (lastAction: string, secondsOnSite: number) => {
    trackEvent('user_dropped_off', {
      last_action: lastAction,
      seconds_on_site: secondsOnSite,
    });
  },

  // Track errors
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }
};