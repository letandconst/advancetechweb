import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { JobOrdersPage } from './pages/JobOrdersPage'
import { MechanicsPage } from './pages/MechanicsPage'
import { ServicesPage } from './pages/ServicesPage'
import { InventoryPage } from './pages/InventoryPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './modules/profile'
import { ROUTES } from './constants'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<AuthPage />} />
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.JOB_ORDERS}
          element={
            <Layout>
              <JobOrdersPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.MECHANICS}
          element={
            <Layout>
              <MechanicsPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.SERVICES}
          element={
            <Layout>
              <ServicesPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.INVENTORY}
          element={
            <Layout>
              <InventoryPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.REPORTS}
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

