import { Helmet } from 'react-helmet-async'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, AdminRoute } from './lib/router/guards'
import { LoginPage } from './app/auth/login/page'
import { RegisterPage } from './app/auth/register/page'
import { ProfilePage } from './app/auth/profile/page'
import { ShellRouter } from './app/shell/ShellRouter'
import { ReportFormPage } from './app/report/ReportFormPage'
import { ReportTrack } from './app/report/ReportTrack'
import ContactsRoute from './app/contacts/page'
import { AlertsFeed } from './components/alerts/AlertsFeed'
import { CreateAlertForm } from './components/alerts/CreateAlertForm'
import { AdminQueueFeed } from './components/report/AdminQueueFeed'

export function App() {
  return (
    <>
      <Helmet>
        <title>Bantayog Alert</title>
      </Helmet>
      <Routes>
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

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ShellRouter />
            </ProtectedRoute>
          }
        >
          <Route index element={null} />
          <Route path="report" element={<ReportFormPage />} />
          <Route path="track/:reportId" element={<ReportTrack />} />
          <Route path="contacts" element={<ContactsRoute />} />
          <Route path="alerts" element={<AlertsFeed />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminQueueFeed />
              </AdminRoute>
            }
          />
          <Route
            path="admin/alerts"
            element={
              <AdminRoute>
                <CreateAlertForm />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
        <Route path="/*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  )
}
