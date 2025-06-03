import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { logout as apiLogoutCall } from './Authe'; // Import the API logout function

const AuthContext = createContext();

// --- DEFINE CONSTANTS ---
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for logout
const WARNING_DURATION_MS = 1 * 60 * 1000;    // Show warning 1 minute before logout

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const navigate = useNavigate();

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Core logout logic (client-side and server-side call)
  const performFullLogout = useCallback(async () => {
    console.log('[AuthContext performFullLogout] Initiating full logout process...');
    setShowInactivityWarning(false); // Ensure warning is hidden

    try {
      // Attempt to call the backend logout endpoint
      // Authe.js already includes the token in its 'logout' function
      await apiLogoutCall();
      console.log('[AuthContext performFullLogout] Backend API logout call successful or not critical.');
    } catch (error) {
      console.warn('[AuthContext performFullLogout] Backend API logout call failed, proceeding with client-side cleanup:', error);
    }

    // Clear local storage and reset state
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
    setUser(null);
    
    console.log('[AuthContext performFullLogout] localStorage cleared, auth state reset. Navigating to /login.');
    navigate('/'); // Navigate to login or home page
  }, [navigate]);

  // Function to reset the inactivity timers
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return; // Only run timers if authenticated

    // console.log('[AuthContext] Resetting inactivity timer.');
    setShowInactivityWarning(false);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      if (isAuthenticated) { // Double-check auth state
        console.log('[AuthContext] Inactivity warning period started.');
        setShowInactivityWarning(true);
      }
    }, INACTIVITY_TIMEOUT_MS - WARNING_DURATION_MS);

    inactivityTimerRef.current = setTimeout(() => {
      if (isAuthenticated) { // Double-check auth state
        console.log('[AuthContext] Inactivity timeout reached. Logging out.');
        performFullLogout();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, performFullLogout]);

  // Effect for managing inactivity event listeners and initial timer start
  useEffect(() => {
    if (isAuthenticated) {
      const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
      // console.log('[AuthContext] User is authenticated, setting up activity listeners.');
      activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer, { passive: true }));
      resetInactivityTimer(); // Start the timer when user becomes authenticated or on authenticated load

      return () => {
        // console.log('[AuthContext] Cleaning up activity listeners and timers.');
        activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
    } else {
      // If not authenticated, clear any existing timers and remove warning
      // console.log('[AuthContext] User not authenticated, clearing timers.');
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      setShowInactivityWarning(false);
    }
  }, [isAuthenticated, resetInactivityTimer]);

  // Effect for handling browser/tab close
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isAuthenticated && localStorage.getItem(TOKEN_KEY)) { // Check if genuinely logged in
        // navigator.sendBeacon is the most reliable way for this
        // Ensure your backend /api/auth/beacon-logout exists and is not protected by JWT auth
        // (or can handle beacon requests appropriately if it is)
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/auth/beacon-logout'); 
          console.log('[AuthContext] Sent beacon for tab/browser close logout.');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]); // Re-run if isAuthenticated changes

  // Effect for initial auth check (runs once on mount)
  useEffect(() => {
    console.log('[AuthContext Init] Checking for token and user in localStorage...');
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUserJson = localStorage.getItem(USER_KEY);

    if (token) {
      setIsAuthenticated(true);
      console.log('[AuthContext Init] Token found.');
      if (storedUserJson) {
        try {
          const parsedUser = JSON.parse(storedUserJson);
          setUser(parsedUser);
          console.log('[AuthContext Init] User data parsed and set:', parsedUser);
        } catch (error) {
          console.error("[AuthContext Init] Failed to parse stored user JSON:", error);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.warn('[AuthContext Init] Token found, but no user data in localStorage.');
        // Optionally, you could trigger a fetch for user details here if only token exists
        // or enforce stricter logout if user data is essential.
      }
    } else {
      console.log('[AuthContext Init] No token found. User is not authenticated.');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []); // Empty dependency array: runs only once on mount

  // Login function
  const login = useCallback((responseData) => {
    console.log('[AuthContext login] Processing login:', responseData);
    if (responseData && responseData.token && responseData.user) {
      localStorage.setItem(TOKEN_KEY, responseData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(responseData.user));
      setUser(responseData.user);
      setIsAuthenticated(true);
      console.log('[AuthContext login] Login successful. User authenticated.');
      // Navigation can happen in the Login component upon successful promise resolution
    } else {
      console.error("[AuthContext login] Login failed: Invalid or incomplete responseData.", responseData);
      // Ensure clean state on failed login attempt
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Public logout function exposed to components
  const logout = useCallback(() => {
    console.log('[AuthContext logout] User initiated logout.');
    performFullLogout();
  }, [performFullLogout]);

  // Handler for "Stay Logged In" button on the inactivity warning
  const handleStayLoggedIn = useCallback(() => {
    console.log('[AuthContext] User chose to stay logged in from warning.');
    resetInactivityTimer(); // This will hide the warning and reset timers
  }, [resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, showInactivityWarning, handleStayLoggedIn }}>
      {children}
      {/* Basic Inactivity Warning Display - Style as a proper modal */}
      {showInactivityWarning && isAuthenticated && (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            padding: '25px', background: 'white', color: '#333',
            border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 10000, textAlign: 'center', minWidth: '300px'
        }}>
          <h3 style={{ marginTop: 0, color: '#d9534f' }}>Session Expiring Soon</h3>
          <p>You will be logged out due to inactivity shortly.</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={handleStayLoggedIn} 
              style={{ padding: '10px 15px', marginRight: '10px', cursor: 'pointer', background: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Stay Logged In
            </button>
            <button 
              onClick={performFullLogout}
              style={{ padding: '10px 15px', cursor: 'pointer', background: '#f0ad4e', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Logout Now
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
