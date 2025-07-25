import React from 'react';
import ReactDOM from 'react-dom/client';
import GuluInventoryApp from './App.tsx'; // Renamed from GuluInventoryApp.tsx to App.tsx
import './index.css'; // Assuming you have a basic index.css for Tailwind

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GuluInventoryApp />
  </React.StrictMode>,
);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
