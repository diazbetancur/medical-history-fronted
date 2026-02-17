export const environment = {
  production: false,
  apiBaseUrl: 'https://qa-api.meditigo.com/api',
  analytics: {
    enabled: true,
    provider: 'ga4' as const,
    measurementId: 'G-XXXXXXXXXX',
    debug: false,
  },
};
