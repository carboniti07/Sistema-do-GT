import React from "react";
import { Navigate } from "react-router-dom";
import { hasPermission } from "./hasPermission";

export default function RequirePermission({ user, perm, children }) {
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!hasPermission(user, perm)) return <Navigate to="/sem-acesso" replace />;
  return children;
}