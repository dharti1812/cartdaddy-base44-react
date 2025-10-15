import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  // Get user from session storage
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  // Check if user is logged in
  if (!user || !token) {
    return <Navigate to="/SuperAdminLogin" replace />;
  }

  // Check user role if required
  if (requiredRole && user.user_type !== requiredRole) {
    return <Navigate to="/SuperAdminLogin" replace />;
  }

  // User is allowed
  return children;
}
