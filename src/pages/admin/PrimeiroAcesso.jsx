import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Lock } from "lucide-react";

import { useAuth } from "../../auth/AuthContext.jsx";
import { api } from "../../lib/api.js";

const TOKEN_KEY = "gt_token";

export default function PrimeiroAcesso() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cur = String(senhaAtual || "").trim();
    const next = String(novaSenha || "").trim();
    const conf = String(confirmacao || "").trim();

    if (!cur || !next || !conf) {
      setError("Preencha todos os campos");
      return;
    }

    if (next.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (next !== conf) {
      setError("A confirmação não confere com a nova senha");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setError("Sessão inválida. Faça login novamente.");
        logout();
        navigate("/admin/login", { replace: true });
        return;
      }

      const data = await api("/auth/change-password", {
        method: "POST",
        token,
        body: { currentPassword: cur, newPassword: next },
      });

      login(data);

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Primeiro acesso">
      <div className="max-w-[560px] mx-auto">
        <Card className="bg-card/92 backdrop-blur-sm border border-white/10 rounded-3xl">
          <div className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock size={16} />
              <span className="text-sm">Atualização de senha</span>
            </div>

            <h1 className="text-2xl font-heading font-semibold mt-4">
              Defina sua nova senha
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              Por segurança, você precisa trocar a senha padrão antes de continuar.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Senha atual"
                type="password"
                value={senhaAtual}
                onChange={(v) => {
                  setSenhaAtual(v);
                  setError("");
                }}
                placeholder="Digite a senha atual"
                error={!!error}
              />

              <Input
                label="Nova senha"
                type="password"
                value={novaSenha}
                onChange={(v) => {
                  setNovaSenha(v);
                  setError("");
                }}
                placeholder="Crie uma nova senha"
                error={!!error}
              />

              <Input
                label="Confirmar nova senha"
                type="password"
                value={confirmacao}
                onChange={(v) => {
                  setConfirmacao(v);
                  setError("");
                }}
                placeholder="Confirme a nova senha"
                error={!!error}
              />

              {error && (
                <p className="text-sm text-red-600 font-medium text-center">
                  {error}
                </p>
              )}

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Salvando..." : "Salvar e continuar"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/admin/login", { replace: true });
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
              >
                Sair
              </button>
            </form>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}