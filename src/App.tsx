import { Helmet } from 'react-helmet-async'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AppCheckProvider } from './lib/app-check'
import { ProtectedRoute, AdminRoute } from './lib/router/guards'
import { LoginPage } from './app/auth/login/page'
import { RegisterPage } from './app/auth/register/page'
import { ProfilePage } from './app/auth/profile/page'
import { ShellRouter } from './app/shell/ShellRouter'
import { ReportFormPage } from './app/report/ReportFormPage'
import { ReportTrack } from './app/report/ReportTrack'
import ContactsRoute from './app/contacts/page'

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

          {/* Protected app routes - nested routing with ShellRouter as layout */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ShellRouter />
              </ProtectedRoute>
            }
          >
            <Route index element={<div className="p-4">Feed coming soon</div>} />
            <Route path="report" element={<ReportFormPage />} />
            <Route path="track/:reportId" element={<ReportTrack />} />
            <Route path="contacts" element={<ContactsRoute />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <ShellRouter />
              </AdminRoute>
            }
          >
            <Route index element={<div className="p-4">Admin Dashboard</div>} />
          </Route>

          {/* Root redirect */}
          <Route path="/*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AppCheckProvider>
    </AuthProvider>
  )
}
