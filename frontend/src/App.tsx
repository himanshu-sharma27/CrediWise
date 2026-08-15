import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RulesPage from "./pages/RulesPage";

// Protected User Pages
import UserDashboard from "./pages/UserDashboard";
import EligibilityPage from "./pages/EligibilityPage";
import NewApplication from "./pages/NewApplication";
import PredictionResult from "./pages/PredictionResult";
import Simulator from "./pages/Simulator";

// Protected Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationsList from "./pages/ApplicationsList";
import AdminUsers from "./pages/AdminUsers";
import Analytics from "./pages/Analytics";
import Monitoring from "./pages/Monitoring";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rules" element={<RulesPage />} />

          {/* Protected Applicant Routes (Role: user) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eligibility"
            element={
              <ProtectedRoute allowedRole="user">
                <EligibilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/new"
            element={
              <ProtectedRoute allowedRole="user">
                <NewApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id/result"
            element={
              <ProtectedRoute allowedRole="user">
                <PredictionResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulator"
            element={
              <ProtectedRoute allowedRole="user">
                <Simulator />
              </ProtectedRoute>
            }
          />

          {/* Protected Administrator Routes (Role: admin) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRole="admin">
                <ApplicationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="admin">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <ProtectedRoute allowedRole="admin">
                <Monitoring />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
