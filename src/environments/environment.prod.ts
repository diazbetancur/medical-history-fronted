export const environment = {
  production: true,
  apiBaseUrl: 'https://medical-history-backend.onrender.com/api',
  analytics: {
    enabled: true,
    provider: 'ga4' as const,
    measurementId: 'G-XXXXXXXXXX',
    debug: false,
  },
};
