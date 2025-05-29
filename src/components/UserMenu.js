// src/components/UserMenu.js
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../services/AuthContext';

const MenuContainer = styled.div`
  position: relative; /* Needed for absolute positioning of the dropdown */
  display: inline-block; /* Adjust display as needed */
`;

const TriggerButton = styled.button`
  cursor: pointer;
  background: none;
  border: none;
  padding: 5px 10px;
  font-weight: bold;
  color: #333; /* Adjust color to fit header */
  display: flex;
  align-items: center;
  gap: 5px;

  /* Add your button styling here if desired, or inherit */
  /* Example: border-radius: 4px; */
  /* &:hover { background-color: #e0e0e0; } */

  /* Using the global style */
  &.my-custom-button-style {
    padding: 0.5rem 1rem; /* Adjust padding */
    box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.8); /* Smaller shadow */
    /* Add other overrides if needed */
  }
   &.my-custom-button-style:hover {
    transform: translateX(1px) translateY(1px);
    box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.9); /* Adjust hover */
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%; /* Position below the trigger */
  right: 0; /* Align to the right */
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 5px 0; /* Padding top/bottom */
  min-width: 150px; /* Minimum width */
  z-index: 100; /* Ensure it's above other content */
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')}; /* Control visibility */
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 10px 15px;
  cursor: pointer;
  color: #333;
  font-size: 0.95rem;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef(null); // Ref for click outside detection

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add listener if menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup: remove listener when component unmounts or menu closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Re-run effect when isOpen changes

  if (!user) {
    // Shouldn't happen if layout correctly checks isAuthenticated, but good failsafe
    return null;
  }

  const handleLogout = () => {
    setIsOpen(false); // Close menu
    logout(); // Call context logout function
  };

  return (
    <MenuContainer ref={menuRef}>
      <TriggerButton onClick={toggleMenu} className="my-custom-button-style">
        {/* You might want a user icon here too */}
        <span>{user.username || 'User'}</span> {/* Display username */}
        {/* Simple down arrow indicator */}
        <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>▼</span>
      </TriggerButton>

      <DropdownMenu $isOpen={isOpen}>
        {/* Add other items here later if needed (e.g., Profile) */}
        <MenuItem onClick={handleLogout}>
          Logout
        </MenuItem>
      </DropdownMenu>
    </MenuContainer>
  );
};

export default UserMenu;