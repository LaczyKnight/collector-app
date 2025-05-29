// Sidebar.js
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const SidebarContainer = styled.div`
  width: 250px;
  min-height: 100%; /* Changed from 100vh to 100% to fill parent if parent is flex item */
  background-color: #fff; 
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  color: #333;
  flex-shrink: 0; /* Prevent sidebar from shrinking */
`;

const Menu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px; 
`;

const MenuItem = styled(Link)`
  padding: 10px 15px; 
  text-decoration: none;
  color: #dee2e6; 
  cursor: pointer;
  border-radius: 4px;
  text-align: center; 
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    background-color: #495057; 
    color: #fff;
  }

  &.my-custom-button-style {
    border: 2px solid black;
    border-radius: 0.375rem;
    background-color: #bc95d4;
    padding: 0.75rem 1.5rem; 
    font-weight: bold;
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
    transition: all 0.3s;
    color: #000; 
  }

  &.my-custom-button-style:hover {
    transform: translateX(3px) translateY(3px);
    box-shadow: none;
    background-color: #a884c0; 
    color: #000;
  }
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <Menu>
        <MenuItem to="/new-entry" className="my-custom-button-style">New Entry</MenuItem>
        <MenuItem to="/dashboard/map" className="my-custom-button-style">Map</MenuItem>
        {/* --- MODIFIED MENU ITEM --- */}
        <MenuItem to="/data-viewer" className="my-custom-button-style">Data Insight</MenuItem> 
        {/* --- END OF MODIFIED MENU ITEM --- */}
        <MenuItem to="/menu-item-3" className="my-custom-button-style">Menu Item 3</MenuItem> 
        {/* You might also want a link back to the main dashboard view */}
        <MenuItem to="/dashboard" className="my-custom-button-style">Dashboard Home</MenuItem>
      </Menu>
    </SidebarContainer>
  );
};

export default Sidebar;