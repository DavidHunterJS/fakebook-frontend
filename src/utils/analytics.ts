// utils/analytics.ts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Type-safe event tracking
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
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
      issues_present: issuesPresent ? 'yes' : 'no',
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