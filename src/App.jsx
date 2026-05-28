import React from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Camisas from "./pages/admin/Camisas.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import Login from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Adolescentes from "./pages/admin/Adolescentes.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";
import NotFound from "./pages/NotFound.jsx";
import Congregacoes from "./pages/admin/Congregacoes.jsx";
import Relatorios from "./pages/admin/Relatorios.jsx";
import Configuracoes from "./pages/admin/Configuracoes.jsx";
import SemAcesso from "./pages/admin/SemAcesso.jsx";
import PrimeiroAcesso from "./pages/admin/PrimeiroAcesso.jsx";

import RequirePermission from "./auth/RequirePermission.jsx";
import { Perms } from "./auth/permissions.js";
import { useAuth } from "./auth/AuthContext.jsx";
import { hasPermission } from "./auth/hasPermission.js";

const queryClient = new QueryClient();
const TOKEN_KEY = "gt_token";

function canViewAdmin(user) {
  return (
    hasPermission(user, Perms.VIEW_ALL) || hasPermission(user, Perms.VIEW_OWN_CONG)
  );
}

function FullScreenLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  );
}

function ProtectedAdminRoute({ user, loading, children }) {
  const hasToken = !!localStorage.getItem(TOKEN_KEY);

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!user && hasToken) {
    return <FullScreenLoading />;
  }

  if (!canViewAdmin(user)) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function ProtectedPermissionRoute({ user, loading, perm, children }) {
  const hasToken = !!localStorage.getItem(TOKEN_KEY);

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!user && hasToken) {
    return <FullScreenLoading />;
  }

  return (
    <RequirePermission user={user} perm={perm}>
      {children}
    </RequirePermission>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/cadastro" replace />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/admin/login" element={<Login />} />
          <Route path="/sem-acesso" element={<SemAcesso />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute user={user} loading={loading}>
                <Dashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/adolescentes"
            element={
              <ProtectedAdminRoute user={user} loading={loading}>
                <Adolescentes />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/jovens"
            element={<Navigate to="/admin/adolescentes" replace />}
          />

          <Route
            path="/admin/relatorios"
            element={
              <ProtectedAdminRoute user={user} loading={loading}>
                <Relatorios />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/congregacoes"
            element={
              <ProtectedPermissionRoute
                user={user}
                loading={loading}
                perm={Perms.MANAGE_USERS}
              >
                <Congregacoes />
              </ProtectedPermissionRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedPermissionRoute
                user={user}
                loading={loading}
                perm={Perms.MANAGE_USERS}
              >
                <Usuarios />
              </ProtectedPermissionRoute>
            }
          />

          <Route
            path="/admin/configuracoes"
            element={
              <ProtectedPermissionRoute
                user={user}
                loading={loading}
                perm={Perms.MANAGE_USERS}
              >
                <Configuracoes />
              </ProtectedPermissionRoute>
            }
          />

          <Route
            path="/admin/camisas"
            element={
              <ProtectedPermissionRoute
                user={user}
                loading={loading}
                perm={Perms.CAMISAS_VIEW}
              >
                <Camisas />
              </ProtectedPermissionRoute>
            }
          />

          <Route path="/admin/primeiro-acesso" element={<PrimeiroAcesso />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}