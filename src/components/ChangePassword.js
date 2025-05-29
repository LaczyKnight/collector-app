import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Removed useLocation
import styled from "styled-components";
import "../Global.css";
// import Layout from "./Layout"; // <-- REMOVE Layout import
import { useAuth } from "../services/AuthContext"; // <-- IMPORT AuthContext

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Use consistent naming

// Container for the whole page content
const ChangePasswordPageContainer = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Container for the form itself
const ChangePasswordFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch; /* Stretch form elements */
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 450px; /* Adjust as needed */
  width: 100%;
  box-sizing: border-box;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px; /* Space between groups */
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: bold;
`;

// Re-using the Input component structure (ensure it handles type="password")
const Input = ({ type = "password", value, setValue, placeholder, ...rest }) => (
  <input
    className="my-custom-input-style"
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    aria-label={placeholder}
    required // Add required attribute
    {...rest}
  />
);

// Button component
const SaveButton = ({ children, disabled }) => (
  <button
    type="submit"
    className="my-custom-button-style"
    disabled={disabled}
    style={{ alignSelf: 'center', marginTop: '10px' }} // Center button
  >
    {children}
  </button>
);

// --- Main ChangePassword Component ---
const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <-- Get user and logout from context

  // Redirect if user data is missing (e.g., page refresh or direct access)
  useEffect(() => {
    if (!user || !user.username) {
      console.warn("ChangePassword: No user found in context, redirecting.");
      // Optionally logout to clear any partial state before redirecting
      logout();
      // navigate("/", { replace: true }); // Redirect handled by logout now
    }
  }, [user, navigate, logout]); // Added logout dependency

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !user.username) {
        setError("User information is missing. Please log in again.");
        return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) { // Example: Basic password strength check
        setError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true); // Start loading

    try {
      // Include token for authentication if backend requires it
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`; // Send token if needed
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: headers,
        // Send username OR rely on backend to identify user via token
        body: JSON.stringify({ username: user.username, newPassword }),
      });

      const responseData = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Use error message from backend if available
        throw new Error(responseData.message || "Failed to change password");
      }

      setSuccess("Password changed successfully! Redirecting to dashboard...");
      // No need to update context here unless the token changes

      // Wait a bit, then navigate
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);

    } catch (error) {
      setError(error.message || "An unexpected error occurred.");
      setIsLoading(false); // Stop loading on error
    }
    // Don't set isLoading false on success because we are navigating away
  };

  // Render null or a loading indicator if user check is pending or failed
  if (!user) {
      return <div style={{ padding: "50px", textAlign: "center"}}>Loading user data...</div>;
  }

  // --- Component Return - NO Layout Wrapper ---
  return (
    // Removed the Layout wrapper
    <ChangePasswordPageContainer>
      <ChangePasswordFormContainer>
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Change Your Password</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9em', color: '#555' }}>
            Welcome, {user.username}! Please set a new password.
        </p>
        {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: "green", textAlign: 'center' }}>{success}</p>}
        <Form onSubmit={handleChangePassword}>
          <FormGroup>
            <Label htmlFor="newPass">New Password:</Label>
            <Input
              id="newPass"
              value={newPassword}
              setValue={setNewPassword}
              placeholder="Enter new password (min 8 chars)"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="confirmPass">Confirm Password:</Label>
            <Input
              id="confirmPass"
              value={confirmPassword}
              setValue={setConfirmPassword}
              placeholder="Confirm new password"
            />
          </FormGroup>
          <SaveButton disabled={isLoading}>
            {isLoading ? "Saving..." : "Change Password"}
          </SaveButton>
        </Form>
      </ChangePasswordFormContainer>
    </ChangePasswordPageContainer>
  );
};

export default ChangePassword;