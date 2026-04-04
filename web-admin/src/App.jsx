import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import AdminLayout from './layouts/AdminLayout';

// Pages to be created
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import PaymentsReportPage from './pages/PaymentsReportPage';
import FeeConfigPage from './pages/FeeConfigPage';
import CharityPage from './pages/CharityPage';
import ComplaintsPage from './pages/ComplaintsPage';
import AlertsPage from './pages/AlertsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import VisitorsLogPage from './pages/VisitorsLogPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center" style={{height: '100vh'}}>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="payments" element={<PaymentsReportPage />} />
            <Route path="visitors" element={<VisitorsLogPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="fee-config" element={<FeeConfigPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="charity" element={<CharityPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
