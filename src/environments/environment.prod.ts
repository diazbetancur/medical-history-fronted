export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:5254/api',
  analytics: {
    enabled: true, // Enable in dev for testing
    provider: 'ga4' as const,
    measurementId: 'G-XXXXXXXXXX', // Replace with your dev/test GA4 ID
    debug: true, // Log events to console in dev
  },
};
