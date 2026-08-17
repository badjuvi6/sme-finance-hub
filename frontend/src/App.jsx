import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import SmeOverview from './pages/sme/SmeOverview';
import Transactions from './pages/sme/Transactions';
import Invoices from './pages/sme/Invoices';
import Financing from './pages/sme/Financing';
import AdminOverview from './pages/admin/AdminOverview';
import AdminApplications from './pages/admin/AdminApplications';

function RoleHome() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={['sme']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<SmeOverview />} />
          <Route path="/dashboard/transactions" element={<Transactions />} />
          <Route path="/dashboard/invoices" element={<Invoices />} />
          <Route path="/dashboard/financing" element={<Financing />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
