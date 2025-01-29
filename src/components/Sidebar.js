// Sidebar.js
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const SidebarContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px;
  color: #fff;
`;

const LogoContainer = styled.div`
  margin-bottom: 40px;
`;

const Menu = styled.div`
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled(Link)`
  padding: 20px 0;
  text-decoration: none;
  color: #fff;
  cursor: pointer;

  &.my-custom-button-style {
    border: 2px solid black;
    border-radius: 0.375rem;
    background-color: #bc95d4;
    padding: 0.75rem 2.5rem;
    font-weight: bold;
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
    transition: all 0.3s;
  }

  &.my-custom-button-style:hover {
    transform: translateX(3px) translateY(3px);
    box-shadow: none;
  }
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <LogoContainer>
        <Logo />
      </LogoContainer>
      <Menu>
        <MenuItem to="/new-entry" className="my-custom-button-style">New Entry</MenuItem>
        <MenuItem to="/dashboard/map" className="my-custom-button-style">Map</MenuItem>
        <MenuItem to="/menu-item-2" className="my-custom-button-style">Menu Item 2</MenuItem>
        <MenuItem to="/menu-item-3" className="my-custom-button-style">Menu Item 3</MenuItem>
      </Menu>
    </SidebarContainer>
  );
};

export default Sidebar;
