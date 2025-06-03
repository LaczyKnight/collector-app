// frontend/src/components/ChangePassword.js
import React, { useState, useEffect } from "react"; // useContext from 'react' is not directly needed
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import "../Global.css";
import { useAuth } from "../services/AuthContext"; // <<< CORRECTED: Only import useAuth

const API_URL_PREFIX = ''; // Use relative paths for API calls in production

// --- Styled Components (assumed to be correct and unchanged from your version) ---
const ChangePasswordPageContainer = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const ChangePasswordFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 450px;
  width: 100%;
  box-sizing: border-box;
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;
const Label = styled.label`
  font-weight: bold;
`;
const Input = ({ type = "password", value, setValue, placeholder, disabled, ...rest }) => (
  <input
    className="my-custom-input-style"
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    aria-label={placeholder}
    required
    disabled={disabled}
    {...rest}
  />
);
const SaveButton = ({ children, disabled }) => (
  <button
    type="submit"
    className="my-custom-button-style"
    disabled={disabled}
    style={{ alignSelf: 'center', marginTop: '10px', cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    {children}
  </button>
);
// --- End Styled Components ---

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, logout, login: updateAuthContextUser, isLoading: authIsLoading } = useAuth(); // Uses the hook

  useEffect(() => {
    if (authIsLoading) {
      console.log("ChangePassword useEffect: Auth context is loading. Waiting...");
      return;
    }

    if (!user) {
      console.warn("ChangePassword useEffect: No authenticated user after auth context loaded. Redirecting to login.");
      logout();
      return;
    }

    if (user && !user.mustChangePassword) {
      console.log("ChangePassword useEffect: User does not need to change password. Redirecting to dashboard.");
      navigate("/dashboard", { replace: true });
    }
  }, [user, authIsLoading, navigate, logout]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!user) {
        setError("User information is missing. Please ensure you are logged in.");
        setIsSubmitting(false);
        return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }
    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        setIsSubmitting(false);
        return;
    }

    try {
      const token = localStorage.getItem("authToken"); // Ensure 'authToken' matches TOKEN_KEY in AuthContext/Authe
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        logout();
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_URL_PREFIX}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      let responseData;
      try {
          responseData = await response.json();
      } catch (jsonError) {
          console.error("ChangePassword API: Failed to parse JSON response", jsonError);
          if (!response.ok) {
              throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          responseData = { success: response.ok }; // Fallback if response ok but not JSON
      }

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to change password. Please try again.");
      }

      setSuccess("Password changed successfully! You will be redirected.");
      
      if (user) {
          const updatedUser = { ...user, mustChangePassword: false };
          updateAuthContextUser({ token, user: updatedUser }); // Update context
      }

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2000);

    } catch (err) {
      console.error("ChangePassword API Error:", err);
      setError(err.message || "An unexpected error occurred while changing password.");
      setIsSubmitting(false);
    }
  };

  if (authIsLoading) {
    return <div style={{ padding: "50px", textAlign: "center"}}>Initializing authentication...</div>;
  }

  if (!user) {
    console.log("ChangePassword render: No user object, rendering minimal or redirecting (should be caught by useEffect).");
    return <div style={{ padding: "50px", textAlign: "center"}}>Verifying user status...</div>;
  }
  
  return (
    <ChangePasswordPageContainer>
      <ChangePasswordFormContainer>
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Change Your Password</h2>
        {user.username && (
            <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9em', color: '#555' }}>
                Welcome, {user.username}! Please set a new password.
            </p>
        )}
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
              disabled={isSubmitting}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="confirmPass">Confirm Password:</Label>
            <Input
              id="confirmPass"
              value={confirmPassword}
              setValue={setConfirmPassword}
              placeholder="Confirm new password"
              disabled={isSubmitting}
            />
          </FormGroup>
          <SaveButton disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Change Password"}
          </SaveButton>
        </Form>
      </ChangePasswordFormContainer>
    </ChangePasswordPageContainer>
  );
};

export default ChangePassword;
