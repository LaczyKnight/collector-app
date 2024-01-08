import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import NewEntry from './components/NewEntry';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/new-entry" element={<NewEntry />} />
      </Routes>
    </Router>
  );
}

export default App;