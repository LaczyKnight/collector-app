import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Styled components
const UserBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #eaeaea;

  &:hover {
    background: #e9ecef;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
`;

const AvatarCircle = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #c197d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: bold;
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  min-width: 180px;
  overflow: hidden;
  z-index: 100;
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const MenuItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    color: #dc3545;
  }

  &:hover {
    background: #f8f9fa;
    color: #000;
  }
`;

// Component
const UserIndicator = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = () => setMenuVisible(false);
    document.addEventListener('click', handleClickOutside);
    
    const user = JSON.parse(localStorage.getItem('user'));
    setUserData(user);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  if (!userData) return null;

  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <UserBadge onClick={() => setMenuVisible(!menuVisible)}>
        <AvatarCircle>
          {userData.username.charAt(0).toUpperCase()}
        </AvatarCircle>
        <span>{userData.username}</span>
      </UserBadge>
      
      <MenuDropdown $visible={menuVisible}>
        <MenuItem onClick={() => navigate('/profile')}>
          Profile Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          Log Out
        </MenuItem>
      </MenuDropdown>
    </div>
  );
};

export default UserIndicator;