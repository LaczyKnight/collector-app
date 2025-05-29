// src/components/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { login as apiLoginService } from "../services/Authe"; // Renamed for clarity from apiLogin
import "../Global.css";
import { useAuth } from "../services/AuthContext";

// Styled Components (remain the same)
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 100%;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: bold;
`;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log('[LOGIN ATTEMPT] Submitting login for username:', username); // <-- ADDED

    try {
      // 1. Call the API service function to attempt login
      // This function should internally call fetch('/api/auth/login', ...)
      // and return the parsed JSON data.
      console.log('[LOGIN ATTEMPT] Calling apiLoginService...'); // <-- ADDED
      const responseData = await apiLoginService(username, password);
      // Example success responseData: { success: true, token: '...', user: {...}, mustChangePassword: false }

      console.log('[LOGIN API RESPONSE] Received data:', responseData); // <-- ADDED

      // Check for explicit success flag and token from backend response
      if (responseData && responseData.success && responseData.token) {
        console.log('[LOGIN API RESPONSE] Login success confirmed by API.'); // <-- ADDED
        console.log('[LOGIN API RESPONSE] Token from API:', responseData.token); // <-- ADDED
        console.log('[LOGIN API RESPONSE] User from API:', responseData.user); // <-- ADDED

        // 2. Call the context's login function.
        // We assume contextLogin handles localStorage.setItem('authToken', responseData.token)
        // and updates the context's state (user, isAuthenticated).
        if (contextLogin) {
          console.log('[LOGIN CONTEXT] Calling contextLogin with API data...'); // <-- ADDED
          contextLogin(responseData); // Pass the whole data object as it contains user and token
          console.log('[LOGIN CONTEXT] contextLogin call completed.'); // <-- ADDED

          // --- VERIFY localStorage immediately AFTER contextLogin is expected to set it ---
          // This is crucial for debugging the current issue.
          const tokenFromStorageAfterContextLogin = localStorage.getItem('authToken');
          console.log('[LOGIN localStorage CHECK] Token from localStorage AFTER contextLogin:', tokenFromStorageAfterContextLogin); // <-- CRITICAL LOG

          if (!tokenFromStorageAfterContextLogin) {
            console.error('[LOGIN ERROR] CRITICAL: Token NOT FOUND in localStorage after contextLogin was called. Check AuthContext.js login implementation!');
            setError('Login seemed successful, but authentication state could not be saved. Please contact support.');
            setIsLoading(false);
            return; // Stop further execution if token isn't stored
          }

        } else {
          console.error('[LOGIN ERROR] AuthContext login function (contextLogin) is not available!'); // <-- ADDED
          setError('Authentication system error. Please try again later.');
          setIsLoading(false);
          return;
        }

        // 3. Navigate based on the API response
        if (responseData.user && responseData.user.mustChangePassword === true) {
          console.log("[LOGIN NAVIGATION] Must change password. Navigating to /change-password");
          navigate("/change-password");
        } else {
          console.log("[LOGIN NAVIGATION] Login complete. Navigating to /dashboard");
          navigate("/dashboard");
        }
      } else {
        // Handle cases where API call was "successful" (e.g., 200 OK) but logic failed (e.g., success: false, or token missing)
        const errorMessage = responseData.message || "Login failed: Invalid response from server.";
        console.error('[LOGIN API RESPONSE] Login failed or token missing in response:', errorMessage, responseData); // <-- ADDED
        setError(errorMessage);
      }

    } catch (err) {
      // This catch block handles errors from apiLoginService (e.g., network error, non-2xx status that apiLoginService throws)
      console.error('[LOGIN ATTEMPT CATCH ERROR]', err); // <-- ADDED
      setError(err.message || "Login failed. Please check credentials or network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <h2 style={{ marginBottom: '20px' }}>Login</h2>
      <LoginForm onSubmit={handleLogin}>
        {error && <p style={{ color: "red", textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
        <FormGroup>
          <Label htmlFor="usernameInput">Username:</Label>
          <input
            id="usernameInput"
            type="text"
            placeholder="Enter your username"
            className="my-custom-input-style"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-required="true"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="passwordInput">Password:</Label>
          <input
            id="passwordInput"
            type="password"
            placeholder="Enter your password"
            className="my-custom-input-style"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required="true"
          />
        </FormGroup>
        <button
          type="submit"
          className="my-custom-button-style"
          disabled={isLoading}
          style={{ marginTop: '10px', alignSelf: 'center' }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;