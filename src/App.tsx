import { ReactNode, Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ROUTES } from './constants'
import { useAuth } from './hooks'

const Layout = lazy(async () => ({ default: (await import('./components/Layout')).Layout }))
const AuthPage = lazy(async () => ({ default: (await import('./pages/AuthPage')).AuthPage }))
const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }))
const JobOrdersPage = lazy(async () => ({ default: (await import('./pages/JobOrdersPage')).JobOrdersPage }))
const JobOrderFormPage = lazy(async () => ({ default: (await import('./pages/JobOrderFormPage')).JobOrderFormPage }))
const MechanicsPage = lazy(async () => ({ default: (await import('./pages/MechanicsPage')).MechanicsPage }))
const ServicesPage = lazy(async () => ({ default: (await import('./pages/ServicesPage')).ServicesPage }))
const InventoryPage = lazy(async () => ({ default: (await import('./pages/InventoryPage')).InventoryPage }))
const ReportsPage = lazy(async () => ({ default: (await import('./pages/ReportsPage')).ReportsPage }))
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }))
const CustomersPage = lazy(async () => ({ default: (await import('./pages')).CustomersPage }))
const UsersPage = lazy(async () => ({ default: (await import('./pages')).UsersPage }))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner message="Loading..." overlay />
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}

function RouteFallback() {
  return <LoadingSpinner message="Loading page..." overlay />
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<RouteFallback />}>
        <Layout>{children}</Layout>
      </Suspense>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.LOGIN}
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AuthPage />
            </Suspense>
          )}
        />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <JobOrdersPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_NEW}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <JobOrderFormPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_VIEW}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <JobOrderFormPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_EDIT}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <JobOrderFormPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.MECHANICS}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <MechanicsPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <CustomersPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.USERS}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <UsersPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.SERVICES}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <ServicesPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.INVENTORY}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <InventoryPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <ReportsPage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedLayout>
              <Suspense fallback={<RouteFallback />}>
                <ProfilePage />
              </Suspense>
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

