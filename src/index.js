import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- Import BrowserRouter HERE
import './index.css';
import App from './App';
import './Global.css';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from '../src/services/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- CORRECTED ORDER --- */}
    <BrowserRouter> {/* <-- Router now wraps AuthProvider */}
      <AuthProvider> {/* <-- AuthProvider is now inside Router */}
        <App /> {/* <-- App remains inside AuthProvider */}
      </AuthProvider>
    </BrowserRouter>
    {/* --- END CORRECTION --- */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();