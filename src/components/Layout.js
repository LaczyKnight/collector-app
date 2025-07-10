// Layout.js
import React from 'react';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import Logo from './Logo';
import UserMenu from './UserMenu';

// --- Styled Components (Unchanged) ---
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  box-sizing: border-box;
  flex-shrink: 0;
`;

const ContentContainer = styled.main`
  width: 100%;
  flex-grow: 1;

  ${({ $isLoginPage }) =>
    $isLoginPage
      ? css`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 20px;
          max-width: 450px;
          margin: 40px auto 0 auto;
          box-sizing: border-box;
        `
      : css`
          display: flex;
        `}
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
`;
// --- End Styled Components ---


// --- THE NEW, FIXED LAYOUT COMPONENT ---
// It now accepts the 'user' object as a prop to make smarter decisions.
const Layout = ({ isAuthenticated, user, isLoginPage }) => {
  const location = useLocation(); // Get the current URL path

  // --- 1. HANDLE UNAUTHENTICATED USERS ---
  // If the user is NOT authenticated and is trying to access a protected page, redirect to login.
  if (!isLoginPage && !isAuthenticated) {
    console.log("[Layout] Not authenticated for a protected page. Redirecting to /");
    return <Navigate to="/" replace />;
  }

  // --- 2. HANDLE AUTHENTICATED USERS (THE CRITICAL FIX IS HERE) ---
  if (isAuthenticated && user) {
    // A. CHECK FOR REQUIRED PASSWORD CHANGE (HIGHEST PRIORITY)
    if (user.mustChangePassword && location.pathname !== '/change-password') {
      console.log("[Layout] User MUST change password. Redirecting to /change-password.");
      // The user is authenticated but MUST change their password. Force them to the change-password page.
      return <Navigate to="/change-password" replace />;
    }

    // B. HANDLE REDIRECT FROM LOGIN PAGE (AFTER a successful login)
    if (isLoginPage && !user.mustChangePassword) {
      console.log("[Layout] Authenticated on login page and no password change needed. Redirecting to /dashboard.");
      // The user is authenticated, does NOT need to change password, and is on the login page. Send to dashboard.
      return <Navigate to="/dashboard" replace />;
    }
  }


  // --- 3. RENDER THE CORRECT LAYOUT BASED ON THE ROUTE ---

  // Render the simple layout for the Login page
  if (isLoginPage) {
    return (
      <Container>
        <ContentContainer $isLoginPage={true}>
          <LogoLink to="/">
            <Logo />
          </LogoLink>
          <Outlet />
        </ContentContainer>
      </Container>
    );
  }

  // Render the full authenticated layout (with header and menu)
  return (
    <Container>
      <Header>
        <LogoLink to="/dashboard">
          <Logo />
        </LogoLink>
        <UserMenu />
      </Header>
      <ContentContainer $isLoginPage={false}>
        <Outlet />
      </ContentContainer>
    </Container>
  );
};

export default Layout;