// src/pages/admin/Configuracoes.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { toast } from "sonner";
import {
  Type,
  Shield,
  KeyRound,
  Save,
  RefreshCcw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const KEY = "gt_config";

const defaultConfig = {
  appName: "Geração Teen",
  adminSubtitle: "Painel Administrativo",
  enableCongregationCustomNames: true,
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export default function Configuracoes() {
  const [cfg, setCfg] = useState(() => loadConfig());
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // confirmação “sem alert”
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const dirty = useMemo(() => {
    try {
      const current = JSON.stringify(cfg);
      const stored = JSON.stringify(loadConfig());
      return current !== stored;
    } catch {
      return true;
    }
  }, [cfg]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setCfg(loadConfig());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const set = (field, value) => setCfg((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    setSaving(true);
    try {
      saveConfig(cfg);
      toast.success("Configurações salvas");
    } catch {
      toast.error("Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  };

  const doReset = () => {
    try {
      setCfg(defaultConfig);
      saveConfig(defaultConfig);
      toast.success("Configurações restauradas");
    } catch {
      toast.error("Não foi possível restaurar");
    } finally {
      setConfirmResetOpen(false);
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        {/* Cabeçalho da página (mesma “vibe” do dashboard: simples e alinhado) */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
              Configurações
            </h2>
            <p className="text-sm text-muted-foreground">
              Personalize textos, acesso e preferências do painel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dirty ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Alterações pendentes
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                Tudo salvo
              </span>
            )}
          </div>
        </div>

        {/* Identidade */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
              <Type size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground">
                Identidade
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Textos exibidos no painel administrativo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome do sistema"
              value={cfg.appName}
              onChange={(v) => set("appName", v)}
              placeholder="Geração Teen"
            />
            <Input
              label="Subtítulo do painel"
              value={cfg.adminSubtitle}
              onChange={(v) => set("adminSubtitle", v)}
              placeholder="Painel Administrativo"
            />
          </div>
        </Card>

        {/* Acesso */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground">
                Acesso administrativo
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Credenciais locais para acesso ao painel.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Permitir login administrativo local
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desative para bloquear o acesso até configurar outra autenticação.
              </p>
            </div>

            <button
              type="button"
              onClick={() => set("allowMockLogin", !cfg.allowMockLogin)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                cfg.allowMockLogin
                  ? "bg-primary border-primary/40"
                  : "bg-card border-border"
              }`}
              aria-label="Alternar login administrativo local"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  cfg.allowMockLogin ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${!cfg.allowMockLogin ? "opacity-60 pointer-events-none" : ""}`}>
            <Input
              label="Email administrativo"
              value={cfg.mockEmail}
              onChange={(v) => set("mockEmail", v)}
             placeholder="admin@geracaoteen.com"
            />

            <div className="relative">
              <Input
                label="Senha administrativa"
                value={cfg.mockPassword}
                onChange={(v) => set("mockPassword", v)}
                placeholder="••••••"
                type={showPass ? "text" : "password"}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-9 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                title={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound size={14} className="text-muted-foreground" />
            <span>
              Recomenda-se trocar essa senha antes de colocar o sistema em uso.
            </span>
          </div>
        </Card>

        {/* Congregações */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
              <KeyRound size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground">
                Congregações
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Preferências de exibição e recursos do módulo.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Permitir nomes personalizados (local)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mantém preferências salvas no navegador.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                set(
                  "enableCongregationCustomNames",
                  !cfg.enableCongregationCustomNames
                )
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                cfg.enableCongregationCustomNames
                  ? "bg-primary border-primary/40"
                  : "bg-card border-border"
              }`}
              aria-label="Alternar nomes personalizados"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  cfg.enableCongregationCustomNames
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Barra de ações (mais “premium” e consistente) */}
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <RefreshCcw size={16} />
            Restaurar padrão
          </button>

          <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      {/* Confirmação “sem alert” (modal simples) */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setConfirmResetOpen(false)}
          />
          <div className="relative w-full max-w-[520px] rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-primary" />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Restaurar configurações
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Isso vai voltar todas as configurações para o padrão. Deseja continuar?
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="h-11 px-4 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={doReset}
                className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
