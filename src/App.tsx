import { Helmet } from 'react-helmet-async'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AppCheckProvider } from './lib/app-check'
import { ProtectedRoute, AdminRoute } from './lib/router/guards'
import { LoginPage } from './app/auth/login/page'
import { RegisterPage } from './app/auth/register/page'
import { ProfilePage } from './app/auth/profile/page'
import { ShellRouter } from './app/shell/ShellRouter'

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
                <ShellRouter />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <ShellRouter />
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
