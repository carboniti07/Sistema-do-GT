import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Cadastro from "./pages/Cadastro.jsx";
import Login from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Jovens from "./pages/admin/Jovens.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";
import NotFound from "./pages/NotFound.jsx";
import Congregacoes from "./pages/admin/Congregacoes.jsx";
import Relatorios from "./pages/admin/Relatorios.jsx";
import Configuracoes from "./pages/admin/Configuracoes.jsx";



const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/cadastro" replace />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/jovens" element={<Jovens />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/congregacoes" element={<Congregacoes />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
          <Route path="/admin/configuracoes" element={<Configuracoes />} />


          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
