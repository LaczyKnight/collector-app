// frontend/src/config/apiConfig.js

/**
 * Determines the base URL for API calls.
 * It prioritizes an environment variable (REACT_APP_API_URL for Create React App,
 * or VITE_API_URL for Vite). If not found, it falls back to a default
 * URL suitable for local development when the backend is on a specific IP/port.
 */
const getApiBaseUrl = () => {
    let apiUrl = '';

    // Check for Create React App environment variable
    if (process.env.REACT_APP_API_URL) {
        apiUrl = process.env.REACT_APP_API_URL;
        console.log('[apiConfig] Using Create React App environment variable REACT_APP_API_URL:', apiUrl);
    }
    // Check for Vite environment variable (if you ever switch or for others reading)
    // Vite uses import.meta.env and variables must be prefixed with VITE_
    else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        apiUrl = import.meta.env.VITE_API_URL;
        console.log('[apiConfig] Using Vite environment variable VITE_API_URL:', apiUrl);
    }

    // If no specific environment variable is found, use a development fallback.
    // IMPORTANT: Ensure this fallback matches your actual development backend URL.
    if (!apiUrl) {
        // This fallback is used if no .env variable is set or if running in an environment
        // where process.env variables aren't injected (e.g., plain browser JS without a build step for .env)
        // For your setup (backend in VM at 192.168.0.61:5000):
        const fallbackUrl = 'http://10.148.85.130:5000';
        console.warn(
            `[apiConfig] No API URL environment variable (REACT_APP_API_URL or VITE_API_URL) found. ` +
            `Using hardcoded fallback: ${fallbackUrl}. ` +
            `For production, ensure the appropriate environment variable is set.`
        );
        apiUrl = fallbackUrl;
    }

    // You might want to remove trailing slashes if they exist,
    // as endpoints are typically prepended with a slash (e.g., /api/entries)
    if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl.slice(0, -1);
    }

    return apiUrl;
};

// Export the configured base URL for use throughout the application