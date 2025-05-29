// frontend/src/services/Authe.js

/**
 * @file Authe.js
 * @description Authentication Service Module
 */

// --- Use the same key as AuthContext for consistency ---
const TOKEN_KEY = 'authToken'; // Or import from a shared constants file

/**
 * Attempts to log in a user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} API response data (e.g., { token: '...', user: {...} })
 * @throws {Error} On failure.
 */
export const login = async (username, password) => {
  const TARGET_URL = '/api/auth/login';
  console.log('[AUTH_SERVICE LOGIN] Attempting to POST to:', TARGET_URL);

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Use message from backend if available, otherwise a generic one
      throw new Error(data.message || `Login failed: ${response.statusText} (Status: ${response.status})`);
    }

    // Assuming backend sends { token: '...', user: {...} } on successful login directly in data.
    // If backend wraps it like { success: true, data: { token: '...', user: {...} } }, adjust accordingly.
    if (!data.token || !data.user) { 
      throw new Error(data.message || 'Authentication failed: Invalid response from server (missing token or user).');
    }
    
    console.log('[AUTH_SERVICE LOGIN] Login API call successful. Data:', data);
    return data; // Expected: { token: '...', user: {...}, mustChangePassword?: boolean }

  } catch (error) {
    console.error(`[AUTH_SERVICE LOGIN] Error during login to ${TARGET_URL}:`, error);
    throw error;
  }
};

/**
* Attempts to log out a user by sending a request to the backend.
* @returns {Promise<object>} API response data (e.g., { message: 'Logged out' })
* @throws {Error} On failure.
*/
export const logout = async () => {
  const TARGET_URL = '/api/auth/logout';
  console.log('[AUTH_SERVICE LOGOUT] Attempting to POST to:', TARGET_URL);

  try {
    const token = localStorage.getItem(TOKEN_KEY); // Use the defined TOKEN_KEY
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // This case should ideally not happen if logout is called from an authenticated state.
      // If it can, the backend should handle unauthenticated logout requests gracefully if needed.
      console.warn('[AUTH_SERVICE LOGOUT] No auth token found for logout. Proceeding without Authorization header.');
    }

    const response = await fetch(TARGET_URL, {
      method: 'POST', // Or GET, depending on your backend logout endpoint design
      headers: headers,
    });

    // Logout might return 204 No Content or a JSON body.
    // If 204, response.json() will fail. Handle this.
    if (response.status === 204) {
        console.log('[AUTH_SERVICE LOGOUT] Logout API call successful (204 No Content).');
        return { success: true, message: 'Logged out successfully.' }; // Simulate a success object
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Logout failed: ${response.statusText} (Status: ${response.status})`);
    }
    
    // If backend sends a success flag, check it
    // if (data.success === false) { // Example check
    //   throw new Error(data.message || 'Logout operation failed on server.');
    // }

    console.log('[AUTH_SERVICE LOGOUT] Logout API call successful. Data:', data);
    return data; // Expected: e.g., { success: true, message: 'Logged out successfully' }

  } catch (error) {
    console.error(`[AUTH_SERVICE LOGOUT] Error during logout from ${TARGET_URL}:`, error);
    // Don't necessarily re-throw if client-side logout should proceed anyway.
    // The AuthContext handles this by proceeding with client-side cleanup.
    // However, re-throwing allows calling components to know about the API error if needed.
    throw error;
  }
};