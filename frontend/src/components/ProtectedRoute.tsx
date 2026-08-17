import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/auth";

import CrediWiseLogo from "./CrediWiseLogo";

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
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <div className="mb-6 animate-pulse">
          <CrediWiseLogo height="56px" />
        </div>
        <div className="flex items-center space-x-2 text-[#1A2B4C] font-bold text-base">
          <div className="w-2 h-2 rounded-full bg-[#D4A373] animate-ping" />
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
