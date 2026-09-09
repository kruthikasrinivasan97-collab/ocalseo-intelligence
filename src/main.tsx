import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuditProvider } from './state/AuditContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuditProvider>
      <App />
    </AuditProvider>
  </StrictMode>,
)
