import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { TrpcProvider } from '@/api/TrpcProvider';
import '@/styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <TrpcProvider>
      <App />
    </TrpcProvider>
  </StrictMode>,
);
