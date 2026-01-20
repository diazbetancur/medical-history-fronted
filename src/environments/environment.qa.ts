export const environment = {
  production: false,
  apiBaseUrl: 'https://api-qa.prodirectory.com/api',
  analytics: {
    enabled: true,
    provider: 'ga4' as const,
    measurementId: 'G-QAXXXXXXXX', // Replace with your QA GA4 ID
    debug: true,
  },
};
