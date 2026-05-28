import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

import bgImg from "../assets/bg-visitors.png";

const TOKEN_KEY = "gt_token";

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  const hasToken = !!localStorage.getItem(TOKEN_KEY);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user && !hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div
      className="min-h-screen flex justify-center p-2 sm:p-3 md:p-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
      }}
    >
      <div className="bg-card rounded-2xl shadow-[0_10px_26px_rgba(0,0,0,0.08)] w-[96vw] max-w-[1700px] h-[92vh] flex overflow-hidden self-center">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-60 h-full animate-in slide-in-from-left">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-[18px] border-b border-border">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-surface-2 transition-colors"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu size={20} className="text-foreground" />
            </button>

            <h1 className="text-base md:text-lg font-heading font-semibold text-foreground leading-none">
              {title}
            </h1>
          </div>

          <div className="flex-1 p-3 md:p-4 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}