import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ServiceProvider } from './di/index.js';
import { AuthProvider } from './contexts/admin/AdminAuthProvider.jsx';
import { ProfileProvider } from './contexts/admin/AdminProfileProvider.jsx';
import { AllianceProvider } from './contexts/admin/AdminAllianceProvider.jsx';
import { TimelineProvider } from './contexts/TimelineContext.jsx';
import { GameStateProvider } from './contexts/GameStateContext.jsx';
import { PlannerProvider } from './contexts/PlannerContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ServiceProvider>
        <AuthProvider>
          <ProfileProvider>
            <AllianceProvider>
              <TimelineProvider>
                <GameStateProvider>
                  <PlannerProvider>
                    <App />
                  </PlannerProvider>
                </GameStateProvider>
              </TimelineProvider>
            </AllianceProvider>
          </ProfileProvider>
        </AuthProvider>
      </ServiceProvider>
    </ToastProvider>
  </StrictMode>,
);
