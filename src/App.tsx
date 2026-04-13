import { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { JobOrdersPage } from './pages/JobOrdersPage'
import { JobOrderFormPage } from './pages/JobOrderFormPage'
import { MechanicsPage } from './pages/MechanicsPage'
import { ServicesPage } from './pages/ServicesPage'
import { InventoryPage } from './pages/InventoryPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { CustomersPage, UsersPage } from './pages'
import { ROUTES } from './constants'
import { useAuth } from './hooks'

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<AuthPage />} />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS}
          element={
            <ProtectedRoute>
              <Layout>
                <JobOrdersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_NEW}
          element={
            <ProtectedRoute>
              <Layout>
                <JobOrderFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_VIEW}
          element={
            <ProtectedRoute>
              <Layout>
                <JobOrderFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS_EDIT}
          element={
            <ProtectedRoute>
              <Layout>
                <JobOrderFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MECHANICS}
          element={
            <ProtectedRoute>
              <Layout>
                <MechanicsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CUSTOMERS}
          element={
            <ProtectedRoute>
              <Layout>
                <CustomersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.USERS}
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SERVICES}
          element={
            <ProtectedRoute>
              <Layout>
                <ServicesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.INVENTORY}
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

