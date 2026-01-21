export const environment = {
  production: true,
  apiBaseUrl:
    'https://back-directory-bdg9fefsbsc3fyer.eastus-01.azurewebsites.net//api',
  analytics: {
    enabled: true, // Enable in dev for testing
    provider: 'ga4' as const,
    measurementId: 'G-XXXXXXXXXX', // Replace with your dev/test GA4 ID
    debug: true, // Log events to console in dev
  },
};
