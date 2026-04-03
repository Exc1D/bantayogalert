import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { App } from '@/App'
import { ReportDetailSheet } from '@/components/report/ReportDetailSheet'

// Placeholder router — actual routes added in Phase 4 (Desktop & Mobile Shell)
// D-03: src/app/router.tsx defines React Router v6 routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/app/report',
    element: <div>ReportForm placeholder — component scaffolding comes in plan 05-03</div>,
  },
  {
    path: '/app/report/:id',
    element: <ReportDetailSheet />,
  },
])

export { router }

export function Router() {
  return <RouterProvider router={router} />
}
