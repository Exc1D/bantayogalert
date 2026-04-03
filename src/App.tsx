import { Helmet } from 'react-helmet-async'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AppCheckProvider } from './lib/app-check'
import { ProtectedRoute, AdminRoute } from './lib/router/guards'
import { LoginPage } from './app/auth/login/page'
import { RegisterPage } from './app/auth/register/page'
import { ProfilePage } from './app/auth/profile/page'

// Placeholder components for protected routes (actual pages in later phases)
function AppLayout() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900">Bantayog Alert</h1>
        <p className="text-gray-500 mt-1">App dashboard (coming in Phase 4)</p>
      </div>
    </div>
  )
}

function AdminPanel() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 mt-1">Admin dashboard (coming in Phase 7)</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppCheckProvider>
        <Helmet>
          <title>Bantayog Alert</title>
        </Helmet>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route
            path="/auth/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected app routes */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </AppCheckProvider>
    </AuthProvider>
  )
}
