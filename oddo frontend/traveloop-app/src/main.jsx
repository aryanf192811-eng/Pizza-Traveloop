import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// NOTE: globals.css is imported in App.jsx — do NOT import it again here

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
