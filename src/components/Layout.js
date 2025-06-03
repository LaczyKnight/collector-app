// Layout.js
import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom'; // Make sure Navigate is imported
import styled, { css } from 'styled-components'; 
import Logo from './Logo'; 
import UserMenu from './UserMenu'; 

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
  flex-grow: 1; // Allows this to take up remaining space if its content does (e.g. Dashboard.js)

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
          // For authenticated views, the direct child (e.g., Dashboard.js) 
          // will handle its own layout, including flex display for sidebar.
          // This container needs to allow its child to grow.
          display: flex; // Important for the child (DashboardContainer) to grow
        `}
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex; 
  align-items: center;
`;

const Layout = ({ isAuthenticated, isLoginPage }) => {
  // --- REDIRECTION LOGIC (Essential) ---
  if (!isLoginPage && !isAuthenticated) {
    console.log("[Layout] Not authenticated for a protected page. Redirecting to /");
    return <Navigate to="/" replace />;
  }
  if (isLoginPage && isAuthenticated) {
    console.log("[Layout] Authenticated on login page. Redirecting to /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // --- LOGIN PAGE LAYOUT ---
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

  // --- AUTHENTICATED LAYOUT (Header + Content Area for Dashboard/NewEntry/DataViewer) ---
  if (isAuthenticated) {
    return (
      <Container>
        <Header>
          <LogoLink to="/dashboard"> 
            <Logo />
          </LogoLink>
          <UserMenu /> 
        </Header>
        <ContentContainer $isLoginPage={false}>
          {/* The Outlet here renders Dashboard.js, NewEntry.js, or DataViewer.js */}
          {/* These components are now responsible for including their own Sidebar */}
          <Outlet /> 
        </ContentContainer>
      </Container>
    );
  }

  console.log('🔴 Layout: Fallback - rendering null. This should be caught by redirection.');
  return null;
};

export default Layout;
