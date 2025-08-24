export const features = {
  savings: import.meta.env.VITE_ENABLE_SAVINGS === 'true',
  groups: import.meta.env.VITE_ENABLE_GROUPS === 'true',
  advancedReporting: import.meta.env.VITE_ENABLE_ADVANCED_REPORTING === 'true',
  mifosIntegration: import.meta.env.VITE_ENABLE_MIFOS_INTEGRATION === 'true',
  debugLogging: import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
  performanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
} as const;

export const isFeatureEnabled = (feature: keyof typeof features): boolean => {
  return features[feature] || false;
};

export const getFeatureConfig = () => features;
