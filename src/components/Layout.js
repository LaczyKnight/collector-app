import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Logo from './Logo'; // Adjust the path based on your project structure

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ isLoginPage }) => (isLoginPage ? 'center' : 'flex-start')};
  max-width: 800px; /* Adjust as needed */
  width: 100%;
  margin: 0 auto; /* Center content horizontally */
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  margin-bottom: ${({ isLoginPage }) => (isLoginPage ? '20px' : '0')};
  align-self: ${({ isLoginPage }) => (isLoginPage ? 'center' : 'flex-start')};
`;

const Layout = ({ children, isAuthenticated, isLoginPage }) => {
  return (
    <Container>
      {isLoginPage ? (
        <ContentContainer isLoginPage={isLoginPage}>
          <LogoLink to="/" isLoginPage={isLoginPage}>
            <Logo />
          </LogoLink>
          {children}
        </ContentContainer>
      ) : isAuthenticated ? (
        <ContentContainer>
          <LogoLink to="/dashboard" isLoginPage={false}>
            <Logo />
          </LogoLink>
          <ContentContainer isLoginPage={false}>{children}</ContentContainer>
        </ContentContainer>
      ) : null}
    </Container>
  );
};

export default Layout;