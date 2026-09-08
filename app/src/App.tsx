import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Spinner } from './components/Spinner'

const LoginPage = lazy(() => import('./auth/LoginPage'))
const SignupPage = lazy(() => import('./auth/SignupPage'))
const CardsListPage = lazy(() => import('./cards/CardsListPage'))
const CardFormPage = lazy(() => import('./cards/CardFormPage'))
const CardDetailPage = lazy(() => import('./cards/CardDetailPage'))
const ScannerPage = lazy(() => import('./scan/ScannerPage'))
const GroupsPage = lazy(() => import('./groups/GroupsPage'))
const GroupDetailPage = lazy(() => import('./groups/GroupDetailPage'))
const InviteRedeemPage = lazy(() => import('./share/InviteRedeemPage'))

function PageFallback() {
  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/invite/:token" element={<InviteRedeemPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/cards" element={<CardsListPage />} />
          <Route path="/cards/new" element={<CardFormPage />} />
          <Route path="/cards/:id" element={<CardDetailPage />} />
          <Route path="/cards/:id/edit" element={<CardFormPage />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/cards" replace />} />
        <Route path="*" element={<Navigate to="/cards" replace />} />
      </Routes>
    </Suspense>
  )
}
