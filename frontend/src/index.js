import React from 'react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Detect Android WebView for optimizations
const isAndroidWebView = typeof window.AndroidPOS !== 'undefined' || 
                         typeof window.AndroidApp !== 'undefined' ||
                         /wv/.test(navigator.userAgent);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isAndroidWebView ? 0 : 1, // No retries on Android for speed
      refetchOnWindowFocus: false,
      staleTime: isAndroidWebView ? 30000 : 5000, // Cache longer on Android
      cacheTime: isAndroidWebView ? 60000 : 30000, // Keep cache longer
    },
  },
});

// Disable Sentry on Android WebView for better performance
if (process.env.REACT_APP_SENTRY_DSN && !isAndroidWebView) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    environment: process.env.REACT_APP_SENTRY_ENV || process.env.NODE_ENV || 'development',
  });
} else if (isAndroidWebView) {
  console.log('🚀 Sentry disabled for Android WebView performance');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Disable StrictMode on Android WebView for better performance
const AppWrapper = isAndroidWebView ? (
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: isAndroidWebView ? 2000 : 4000, // Shorter toasts on Android
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: isAndroidWebView ? 1500 : 3000,
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        },
        error: {
          duration: isAndroidWebView ? 3000 : 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </QueryClientProvider>
) : (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);

root.render(AppWrapper);

// Service worker disabled - PWA functionality removed




