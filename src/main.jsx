import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./auth/AuthContext.jsx";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Elemento #root não encontrado no index.html");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);