// Copy this file to environment.ts and environment.prod.ts
// and update with your actual configuration values

export const environment = {
  production: false, // Set to true for production
  apiBaseUrl: "http://localhost:3001/api/v1", // Your API base URL
  appName: "TripWiz",
  enableDebugMode: true, // Set to false for production
  apiTimeout: 30000, // API request timeout in milliseconds
};
