// Dashboard.js
import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardContainer = styled.div`
  display: flex;
  flex-grow: 1;
  width: 100%; 
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
`;

const Dashboard = () => {
  return (
    <DashboardContainer>
      <Sidebar />
      <MainContent>
        <Outlet />
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;