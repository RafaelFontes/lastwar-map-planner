import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ServiceProvider } from './di/index.js'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ServiceProvider>
        <App />
      </ServiceProvider>
    </AuthProvider>
  </StrictMode>,
)
