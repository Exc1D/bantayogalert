import { Helmet } from 'react-helmet-async'
import { AuthProvider } from './lib/auth'

export function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Bantayog Alert</title>
      </Helmet>
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#ffffff' }} />
    </AuthProvider>
  )
}
