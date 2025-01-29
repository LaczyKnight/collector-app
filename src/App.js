// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Global.css';
import Login from './components/Login';
import NewEntry from './components/NewEntry';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView'; // Import the MapView component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/new-entry" element={<NewEntry />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="map" element={<MapView />} /> {/* A MapView itt lesz elérhető */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
