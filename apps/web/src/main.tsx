import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { AdminApp } from '@/admin/AdminApp';
import { TrpcProvider } from '@/api/TrpcProvider';
import { initNative } from '@/native/capacitor-init';
import '@/styles/global.css';

initNative();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

// Admin CMS lives at /admin (dev tool, not part of the game UX). Player app is
// the fallback for everything else.
const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(rootEl).render(
  <StrictMode>
    <TrpcProvider>{isAdmin ? <AdminApp /> : <App />}</TrpcProvider>
  </StrictMode>,
);
