import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeTheme } from './utils/theme';

initializeTheme();

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  const isSyncPrd = url.includes('/testcase/sync-prd');

  if (!isSyncPrd) {
    window.dispatchEvent(new Event('apiLoadStart'));
  }
  try {
    const response = await originalFetch(...args);
    return response;
  } finally {
    if (!isSyncPrd) {
      window.dispatchEvent(new Event('apiLoadEnd'));
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
