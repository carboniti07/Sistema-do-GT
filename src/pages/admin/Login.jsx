import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import { Eye, EyeOff, Lock } from "lucide-react";

import bgImg from "../../assets/bg-visitors.png";

import { useAuth } from "../../auth/AuthContext.jsx";
import { api } from "../../lib/api.js";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const eEmail = String(email || "").trim().toLowerCase();
    const eSenha = String(senha || "").trim();

    if (!eEmail || !eSenha) {
      setError("Preencha email e senha");
      return;
    }

    try {
      setLoading(true);

      const data = await api("/auth/login", {
        method: "POST",
        body: { email: eEmail, password: eSenha },
      });

      login(data);

      if (data?.user?.mustChangePassword) {
        navigate("/admin/primeiro-acesso", { replace: true });
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,160,60,0.92), rgba(255,70,0,0.92)), url(${bgImg})`,
      }}
    >
      <Card className="w-full max-w-[520px] bg-card/92 backdrop-blur-sm border border-white/20 shadow-[0_18px_50px_rgba(0,0,0,0.18)] rounded-3xl">
        <div className="flex flex-col items-center">
          <Logo size="login" />
          <div className="mt-5 flex items-center gap-2 text-muted-foreground">
            <Lock size={16} />
            <span className="text-sm">Acesso Administrativo</span>
          </div>
        </div>

        <h1 className="text-2xl font-heading font-semibold text-foreground text-center mt-6">
          Painel UMADRUR
        </h1>
        <p className="text-muted-foreground text-center mt-2 mb-7">
          Entre com suas credenciais para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError("");
            }}
            placeholder="seu@email.com"
            error={!!error}
          />

          <div className="relative">
            <Input
              label="Senha"
              type={showPass ? "text" : "password"}
              value={senha}
              onChange={(v) => {
                setSenha(v);
                setError("");
              }}
              placeholder="Sua senha"
              error={!!error}
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
          )}

          <Button type="submit" fullWidth className="mt-2" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 pt-6 border-t border-border">
          &copy; 2026 UMADRUR | Sistema Oficial | Desenvolvido por Carboni
        </p>
      </Card>
    </div>
  );
}