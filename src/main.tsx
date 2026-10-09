import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for PWA offline app shell with cache protection
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('🔄 RAVINI V2 update detected. Refreshing cache...');
        updateSW(true);
      },
      onRegistered(r) {
        console.log('✅ RAVINI PWA Service Worker Registered:', r?.scope);
      },
      onRegisterError(error) {
        console.warn('⚠️ RAVINI PWA SW Registration Notice:', error);
      },
    });
  } catch (swError) {
    console.warn('⚠️ Service worker registration safely bypassed:', swError);
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary isRootBoundary={true}>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

