export const environment = {
  production: false,
  apiBaseUrl: 'https://qa-api.meditigo.com/api',
  analytics: {
    enabled: false, // I-12: disabled until real GA4 ID is configured
    provider: 'ga4' as const,
    measurementId: 'G-XXXXXXXXXX', // set a real GA4 ID and flip enabled to true when ready
    debug: false,
  },
};
