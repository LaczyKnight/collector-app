// Dashboard.js
import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
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
        <Outlet /> {/* Ez helyezi el a gyermek útvonalak tartalmát */}
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;
