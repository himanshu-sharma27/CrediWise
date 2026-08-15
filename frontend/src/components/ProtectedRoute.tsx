import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-850 flex items-center justify-center text-white shadow-md animate-pulse mb-4">
          <ShieldCheck className="w-9 h-9 text-coral-400" />
        </div>
        <div className="flex items-center space-x-2 text-teal-850 font-bold text-lg">
          <div className="w-2 h-2 rounded-full bg-coral-500 animate-ping" />
          <span>Verifying CrediWise Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended route via returnTo query param
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Role authorization checks
  if (allowedRole && user && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
