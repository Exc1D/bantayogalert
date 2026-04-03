import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/app" replace /> },
      {
        path: 'auth',
        children: [
          { path: 'login', element: <div>Login (Phase 3)</div> },
          { path: 'register', element: <div>Register (Phase 3)</div> },
        ],
      },
      { path: 'app', element: <div>App Shell (Phase 4)</div> },
      {
        path: 'public',
        children: [
          { path: 'map', element: <div>Public Map (Phase 6)</div> },
          { path: 'alerts', element: <div>Public Alerts (Phase 10)</div> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export const AppRouter = () => <RouterProvider router={router} />
