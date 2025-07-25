import React from 'react';
import ReactDOM from 'react-dom/client';
import GuluInventoryApp from './App.tsx';
import './index.css'; // Assuming you have a basic index.css for Tailwind

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuluInventoryApp />
  </React.StrictMode>,
);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // The path to the service worker should be relative to the root of your deployment.
    // Vite's `base` configuration in vite.config.js will handle prefixing this path
    // correctly for GitHub Pages (e.g., /my-gulu-app/service-worker.js).
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
