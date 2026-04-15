import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import { Users, Droplets, Sparkles, Shield, BarChart3, Building2, RefreshCcw } from "lucide-react";
import { listJovens } from "../../lib/jovensApi";
import { congregacoes, getCongregacaoNome } from "../../lib/congregacoes";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Perms } from "../../auth/permissions.js";
import { hasPermission } from "../../auth/hasPermission.js";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Invalid";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

function isValidMonth(k) {
  return k && k !== "Invalid" && k.includes("-");
}

function CustomTooltip({ active, payload, label, labelPrefix }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="text-xs text-muted-foreground">
        {labelPrefix ? `${labelPrefix}: ` : ""}
        <span className="text-foreground font-medium">{label}</span>
      </div>

      <div className="mt-1 text-sm text-foreground font-semibold tabular-nums">
        {payload[0].value}
      </div>
    </div>
  );
}

export default function Relatorios() {
  const { user } = useAuth();
  const [jovens, setJovens] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewAll = hasPermission(user, Perms.VIEW_ALL);
  const isLimited = !canViewAll && hasPermission(user, Perms.VIEW_OWN_CONG);

  const congregacoesVisiveis = useMemo(() => {
    if (isLimited) {
      const ids = Array.isArray(user?.congregacaoIds) ? user.congregacaoIds : [];
      return ids.map((id) => getCongregacaoNome(id)).filter(Boolean);
    }
    return congregacoes;
  }, [isLimited, user]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await listJovens();
      setJovens(Array.isArray(data?.jovens) ? data.jovens : []);
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar relatórios");
      setJovens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const total = jovens.length;
    const batAguas = jovens.filter((j) => j.batismoAguas).length;
    const batES = jovens.filter((j) => j.batismoES).length;
    const comCargo = jovens.filter((j) => j.cargo).length;
    return { total, batAguas, batES, comCargo };
  }, [jovens]);

  const cadastrosPorMes = useMemo(() => {
    const map = {};

    jovens.forEach((j) => {
      const k = monthKey(j.createdAt || j.dataCadastro);
      if (!isValidMonth(k)) return;
      map[k] = (map[k] || 0) + 1;
    });

    const keys = Object.keys(map).sort();
    return keys.map((k) => ({
      mes: monthLabel(k),
      cadastros: map[k],
    }));
  }, [jovens]);

  const porCongregacao = useMemo(() => {
    const base = congregacoesVisiveis;
    const map = {};

    base.forEach((c) => {
      map[c] = 0;
    });

    jovens.forEach((j) => {
      const nome = getCongregacaoNome(j.congregacaoId);
      map[nome] = (map[nome] || 0) + 1;
    });

    return base
      .map((c) => ({ congregacao: c, total: map[c] || 0 }))
      .sort((a, b) => b.total - a.total);
  }, [jovens, congregacoesVisiveis]);

  const top10Cong = useMemo(() => porCongregacao.slice(0, 10), [porCongregacao]);

  const recortes = useMemo(() => {
    const batAguasSim = jovens.filter((j) => j.batismoAguas).length;
    const batAguasNao = jovens.length - batAguasSim;

    const batESSim = jovens.filter((j) => j.batismoES).length;
    const batESNao = jovens.length - batESSim;

    const comCargo = jovens.filter((j) => j.cargo).length;
    const semCargo = jovens.length - comCargo;

    return { batAguasSim, batAguasNao, batESSim, batESNao, comCargo, semCargo };
  }, [jovens]);

  const PRIMARY = "hsl(var(--primary))";
  const GRID = "hsl(var(--border))";
  const MUTED = "hsl(var(--muted-foreground))";

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors"
            title="Atualizar"
          >
            <RefreshCcw size={16} className="text-muted-foreground" />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Building2}
            value={loading ? "..." : congregacoesVisiveis.length}
            label="Congregações"
          />
          <StatCard icon={Users} value={loading ? "..." : totals.total} label="Total de jovens" />
          <StatCard icon={Droplets} value={loading ? "..." : totals.batAguas} label="Batizados nas Águas" />
          <StatCard icon={Sparkles} value={loading ? "..." : totals.batES} label="Batizados com Espírito Santo" />
          <StatCard icon={Shield} value={loading ? "..." : totals.comCargo} label="Com cargo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground">
                  Evolução de cadastros por mês
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Acompanhe a variação de registros ao longo do tempo.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <BarChart3 size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Períodos</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {cadastrosPorMes.length}
                </span>
              </div>
            </div>

            <div className="h-72">
              {cadastrosPorMes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado disponível para o período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cadastrosPorMes} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                    <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip labelPrefix="Mês" />} />
                    <Line
                      type="monotone"
                      dataKey="cadastros"
                      stroke={PRIMARY}
                      strokeWidth={3}
                      dot={{ r: 3, stroke: PRIMARY, strokeWidth: 2, fill: "hsl(var(--card))" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading font-semibold text-foreground">
                  Ranking por congregação
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLimited
                    ? "Distribuição da sua congregação."
                    : "Distribuição de cadastros entre as congregações (Top 10)."}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <span className="text-sm text-muted-foreground">Top</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {isLimited ? congregacoesVisiveis.length : 10}
                </span>
              </div>
            </div>

            <div className="h-72">
              {top10Cong.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado disponível para o ranking.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Cong} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                    <XAxis dataKey="congregacao" hide />
                    <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0].payload;
                        return (
                          <CustomTooltip
                            active={active}
                            payload={payload}
                            label={row.congregacao}
                            labelPrefix="Congregação"
                          />
                        );
                      }}
                    />
                    <Bar dataKey="total" fill={PRIMARY} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Dica: passe o mouse nas barras para ver o nome da congregação.
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="font-heading font-semibold text-foreground mb-4">
            Indicadores (resumo)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Batismo nas Águas</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sim</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.batAguasSim}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Não</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.batAguasNao}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Batismo com Espírito Santo</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sim</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.batESSim}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Não</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.batESNao}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Cargo eclesiástico</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Com cargo</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.comCargo}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sem cargo</span>
                <span className="text-foreground font-semibold tabular-nums">{recortes.semCargo}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}