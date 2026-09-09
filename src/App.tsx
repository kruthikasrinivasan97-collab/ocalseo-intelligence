import { useAudit } from './state/AuditContext'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const { status, bundle } = useAudit()

  if (status === 'ready' && bundle) {
    return <DashboardPage />
  }

  if (status === 'loading') {
    return <LoadingScreen />
  }

  return <LandingPage />
}
