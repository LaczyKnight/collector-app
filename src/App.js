// frontend/src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import './Global.css';
import { useAuth } from "../src/services/AuthContext";

import Login from './components/Login';
import NewEntry from './components/NewEntry';
import Dashboard from './components/Dashboard';
import ChangePassword from './components/ChangePassword';
import MapView from './components/MapView';
import Layout from './components/Layout';
import DataViewer from './components/DataViewer';
import EditEntry from './components/EditEntry';

// import NotFound from './components/NotFound';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* --- Login / Public Routes --- */}
      <Route
        path="/"
        element={<Layout isLoginPage={true} isAuthenticated={isAuthenticated} />}
      >
        <Route index element={<Login />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* --- Authenticated Routes --- */}
      <Route
        path="/dashboard"
        element={<Layout isAuthenticated={isAuthenticated} isLoginPage={false} />}
      >
        <Route index element={<Dashboard />} />
        <Route path="map" element={<MapView />} />
      </Route>

      <Route
        path="/new-entry"
        element={<Layout isAuthenticated={isAuthenticated} isLoginPage={false} />}
      >
        <Route index element={<NewEntry />} />
      </Route>

     
      <Route
        path="/data-viewer" // This path matches your Sidebar link
        element={<Layout isAuthenticated={isAuthenticated} isLoginPage={false} />}
      >
        {/* Renders DataViewer component at "/data-viewer" */}
        <Route index element={<DataViewer />} />
      </Route>
    
      <Route
        path="/edit-entry/:entryId" // Use :entryId to match useParams() in EditEntry.js
        element={<Layout isAuthenticated={isAuthenticated} isLoginPage={false} />}
      >
        {/* Renders EditEntry component at "/edit-entry/some-id-value" */}
        <Route index element={<EditEntry />} />
      </Route>
    


      <Route path="*" element={
        <Layout isAuthenticated={isAuthenticated} isLoginPage={!isAuthenticated}>
             <div style={{ padding: '50px', textAlign: 'center' }}>
                 <h2>404 - Page Not Found</h2>
                 <p>The page you are looking for does not exist.</p>
             </div>
         </Layout>
       }/>
    </Routes>
  );
}

export default App;