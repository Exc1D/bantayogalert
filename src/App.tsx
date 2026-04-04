import { Fragment, Suspense, lazy } from 'react'
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
import { PrivateRouteMeta } from './lib/seo/PrivateRouteMeta'
import { LandingPage } from './app/public/landing/page'

const PublicMapPage = lazy(async () => ({
  default: (await import('./app/public/map/page')).PublicMapPage,
}))

const PublicAlertsPage = lazy(async () => ({
  default: (await import('./app/public/alerts/page')).PublicAlertsPage,
}))

const PublicAlertDetailPage = lazy(async () => ({
  default: (await import('./app/public/alerts/detail/page')).PublicAlertDetailPage,
}))

const AdminAnalyticsPage = lazy(async () => ({
  default: (await import('./app/admin/analytics/page')).AdminAnalyticsPage,
}))

const AdminAuditPage = lazy(async () => ({
  default: (await import('./app/admin/audit/page')).AdminAuditPage,
}))

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-slate-950 text-sm font-medium text-slate-300">
      Loading route...
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/public/map"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PublicMapPage />
          </Suspense>
        }
      />
      <Route
        path="/public/alerts"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PublicAlertsPage />
          </Suspense>
        }
      />
      <Route
        path="/public/alerts/:alertId"
        element={
          <Suspense fallback={<RouteFallback />}>
            <PublicAlertDetailPage />
          </Suspense>
        }
      />
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
            <Fragment>
              <PrivateRouteMeta title="Operations workspace" />
              <ShellRouter />
            </Fragment>
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
        <Route
          path="admin/analytics"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteFallback />}>
                <AdminAnalyticsPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteFallback />}>
                <AdminAuditPage />
              </Suspense>
            </AdminRoute>
          }
        />
      </Route>

      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
