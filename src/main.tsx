import React from 'react';
import ReactDOM from 'react-dom/client';
import GuluInventoryApp from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuluInventoryApp />
  </React.StrictMode>,
);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Get the base URL from Vite's environment variables
    const baseUrl = import.meta.env.BASE_URL || '/';

    // Register the service worker using the correct base URL
    navigator.serviceWorker.register(`${baseUrl}service-worker.js`)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}