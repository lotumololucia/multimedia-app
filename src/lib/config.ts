// Runtime configuration
let runtimeConfig: {
    API_BASE_URL: string;
  } | null = null;
  
  // Configuration loading state
  let configLoading = true;
  
  // Default fallback configuration
  const defaultConfig = {
    API_BASE_URL: 'http://127.0.0.1:8000', // Only used if runtime config fails to load
  };
  
export async function loadRuntimeConfig(): Promise<void> {
  // Comentamos esto para evitar el error de proxy local
  // const response = await fetch('/api/config'); 
  configLoading = false;
  console.log('🔧 DEBUG: Skipping remote config, using local defaults.');
}
  
  // Get current configuration
  export function getConfig() {
    // If config is still loading, return default config to avoid using stale Vite env vars
    if (configLoading) {
      console.log('Config still loading, using default config');
      return defaultConfig;
    }
  
    // First try runtime config (for Lambda)
    if (runtimeConfig) {
      console.log('Using runtime config');
      return runtimeConfig;
    }
  
    // Then try Vite environment variables (for local development)
    if (import.meta.env.VITE_API_BASE_URL) {
      const viteConfig = {
        API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      };
      console.log('Using Vite environment config');
      return viteConfig;
    }
  
    // Finally fall back to default
    console.log('Using default config');
    return defaultConfig;
  }
  
  // Dynamic API_BASE_URL getter - this will always return the current config
  export function getAPIBaseURL(): string {
    const baseURL = getConfig().API_BASE_URL;
    // If the base URL is just '/', return empty string to avoid double slashes and incorrect http:// prefix
    if (baseURL === '/') {
      return '';
    }
    return baseURL;
  }
  
  // For backward compatibility, but this should be avoided
  // Removed static export to prevent using stale config values
  // export const API_BASE_URL = getAPIBaseURL();
  
  export const config = {
    get API_BASE_URL() {
      return getAPIBaseURL();
    },
  };
  