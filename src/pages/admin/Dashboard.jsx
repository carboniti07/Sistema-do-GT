import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import Table from "../../components/Table";
import { listJovens } from "../../lib/jovensApi";
import {
  Users,
  Droplets,
  Sparkles,
  Shield,
  RefreshCcw,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  congregacoes,
  formatCongregacao,
  getCongregacaoNome,
} from "../../lib/congregacoes";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Perms } from "../../auth/permissions.js";
import { hasPermission } from "../../auth/hasPermission.js";

function calcAge(nascimento) {
  if (!nascimento) return 0;

  const today = new Date();
  const birth = new Date(nascimento);

  if (Number.isNaN(birth.getTime())) return 0;

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatTodayPtBR() {
  try {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("pt-BR");
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
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
      toast.error(err?.message || "Erro ao carregar dashboard");
      setJovens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const total = jovens.length;
  const batAguas = jovens.filter((j) => j.batismoAguas).length;
  const batES = jovens.filter((j) => j.batismoES).length;
  const comCargo = jovens.filter((j) => j.cargo).length;

  const congDist = {};
  jovens.forEach((j) => {
    const label = getCongregacaoNome(j.congregacaoId);
    const key = formatCongregacao(label);
    congDist[key] = (congDist[key] || 0) + 1;
  });

  const congregacoesBase = congregacoesVisiveis.map((name) => ({
    label: name,
    key: formatCongregacao(name),
  }));

  const congEntries = congregacoesBase.map(({ label, key }) => [
    label,
    congDist[key] || 0,
  ]);

  const ageRanges = { "16-18": 0, "19-22": 0, "23-25": 0, "26+": 0 };

  jovens.forEach((j) => {
    const age = calcAge(j.nascimento);
    if (age <= 0) return;
    if (age <= 18) ageRanges["16-18"]++;
    else if (age <= 22) ageRanges["19-22"]++;
    else if (age <= 25) ageRanges["23-25"]++;
    else ageRanges["26+"]++;
  });

  const recent = [...jovens]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentColumns = [
    { key: "nome", label: "Nome" },
    {
      key: "congregacaoId",
      label: "Congregação",
      render: (v) => getCongregacaoNome(v),
    },
    {
      key: "createdAt",
      label: "Data",
      render: (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : ""),
    },
  ];

  const todayLabel = useMemo(() => formatTodayPtBR(), []);
  const topCongEntries = useMemo(() => {
    return [...congEntries].sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 8);
  }, [congEntries]);

  const avgAge = useMemo(() => {
    if (!total) return 0;

    const validAges = jovens
      .map((j) => calcAge(j.nascimento))
      .filter((age) => age > 0);

    if (!validAges.length) return 0;

    const sum = validAges.reduce((acc, age) => acc + age, 0);
    return Math.round(sum / validAges.length);
  }, [jovens, total]);

  const congregacaoTitulo = isLimited
    ? congregacoesVisiveis.join(", ") || "Sua congregação"
    : "Todas as congregações";

  return (
    <AdminLayout title="Dashboard">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Painel Administrativo
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLimited
              ? `Resumo geral de ${congregacaoTitulo}`
              : "Resumo geral e indicadores da UMADRUR"}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <CalendarDays size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{todayLabel}</span>
          </div>

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard icon={Users} value={loading ? "..." : total} label="Total de Jovens" />
        <StatCard icon={Droplets} value={loading ? "..." : batAguas} label="Batizados nas Águas" />
        <StatCard icon={Sparkles} value={loading ? "..." : batES} label="Batizados com Espírito Santo" />
        <StatCard icon={Shield} value={loading ? "..." : comCargo} label="Jovens com Cargo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-6">
        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Distribuição por Congregação
              </h3>
              <p className="text-xs text-muted-foreground">
                {isLimited ? "Sua congregação" : "Top 8 congregações por quantidade"}
              </p>
            </div>

            {!isLimited && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
                title="Ver todas"
                onClick={() => navigate("/admin/congregacoes")}
              >
                Ver todas <ArrowRight size={16} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {topCongEntries.map(([name, count]) => (
              <div key={name} className="group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground truncate pr-2">{name}</span>
                  <span className="text-muted-foreground tabular-nums">{count}</span>
                </div>

                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary rounded-full h-2 transition-all group-hover:opacity-95"
                    style={{
                      width: total > 0 ? `${(count / total) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {!isLimited && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">
                Lista completa (rolagem interna)
              </div>
              <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3">
                {congEntries.map(([name, count]) => (
                  <div key={`${name}-all`} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground truncate pr-2">{name}</span>
                      <span className="text-muted-foreground tabular-nums">{count}</span>
                    </div>

                    <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary rounded-full h-2 transition-all group-hover:opacity-95"
                        style={{
                          width: total > 0 ? `${(count / total) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Faixa Etária
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribuição por idade (base: {loading ? "..." : total} registros)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(ageRanges).map(([range, count]) => (
              <div key={range} className="group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{range} anos</span>
                  <span className="font-medium text-foreground tabular-nums">{count}</span>
                </div>

                <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary rounded-full h-2 transition-all group-hover:opacity-95"
                    style={{
                      width: total > 0 ? `${(count / total) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="rounded-xl bg-surface-2/60 border border-border px-3 py-2">
              <div className="text-xs text-muted-foreground">Média (aprox.)</div>
              <div className="text-base font-heading font-semibold text-foreground tabular-nums">
                {loading ? "..." : `${avgAge} anos`}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-heading font-semibold text-foreground text-base">
              Últimos Cadastros
            </h3>
            <p className="text-xs text-muted-foreground">Exibindo os 5 mais recentes</p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
            title="Ver todos"
            onClick={() => navigate("/admin/jovens")}
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        <div className="-mx-2 sm:mx-0">
          <div className="overflow-x-auto px-2 sm:px-0">
            <div className="min-w-[620px]">
              <Table columns={recentColumns} data={recent} />
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}