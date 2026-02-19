import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import Table from "../../components/Table";
import { mockJovens } from "../../lib/mockData";
import {
  Users,
  Droplets,
  Sparkles,
  Shield,
  RefreshCcw,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { congregacoes, formatCongregacao } from "../../lib/congregacoes";

function calcAge(nascimento) {
  const today = new Date();
  const birth = new Date(nascimento);
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

  const total = mockJovens.length;
  const batAguas = mockJovens.filter((j) => j.batismoAguas).length;
  const batES = mockJovens.filter((j) => j.batismoES).length;
  const comCargo = mockJovens.filter((j) => j.cargo).length;

  // 🔹 Distribuição SOMENTE com base na lista oficial
  const congDist = {};

  mockJovens.forEach((j) => {
    const normalized = formatCongregacao(j.congregacao);

    // Só conta se existir na lista oficial
    const exists = congregacoes.find((c) => formatCongregacao(c) === normalized);

    if (exists) {
      const key = formatCongregacao(exists);
      congDist[key] = (congDist[key] || 0) + 1;
    }
  });

  const congregacoesOficiais = congregacoes.map((name) => ({
    label: name,
    key: formatCongregacao(name),
  }));

  const congEntries = congregacoesOficiais.map(({ label, key }) => [
    label,
    congDist[key] || 0,
  ]);

  const ageRanges = { "16-18": 0, "19-22": 0, "23-25": 0, "26+": 0 };

  mockJovens.forEach((j) => {
    const age = calcAge(j.nascimento);
    if (age <= 18) ageRanges["16-18"]++;
    else if (age <= 22) ageRanges["19-22"]++;
    else if (age <= 25) ageRanges["23-25"]++;
    else ageRanges["26+"]++;
  });

  const recent = [...mockJovens]
    .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro))
    .slice(0, 5);

  const recentColumns = [
    { key: "nome", label: "Nome" },
    {
      key: "congregacao",
      label: "Congregação",
      render: (v) => {
        const normalized = formatCongregacao(v);
        const exists = congregacoes.find((c) => formatCongregacao(c) === normalized);
        return exists || ""; // se não existir na lista oficial, não mostra nada
      },
    },
    {
      key: "dataCadastro",
      label: "Data",
      render: (v) => new Date(v).toLocaleDateString("pt-BR"),
    },
  ];

  const todayLabel = useMemo(() => formatTodayPtBR(), []);
  const topCongEntries = useMemo(() => {
    return [...congEntries].sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 8);
  }, [congEntries]);

  const avgAge = useMemo(() => {
    if (!total) return 0;
    const sum = mockJovens.reduce((acc, j) => acc + calcAge(j.nascimento), 0);
    return Math.round(sum / total);
  }, [total]);

  return (
    <AdminLayout title="Dashboard">
      {/* HEADER PROFISSIONAL */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Painel Administrativo
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumo geral e indicadores da UMADRUR Connect
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <CalendarDays size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{todayLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors"
            title="Atualizar"
          >
            <RefreshCcw size={16} className="text-muted-foreground" />
            Atualizar
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard icon={Users} value={total} label="Total de Jovens" />
        <StatCard icon={Droplets} value={batAguas} label="Batizados nas Águas" />
        <StatCard icon={Sparkles} value={batES} label="Batizados com Espírito Santo" />
        <StatCard icon={Shield} value={comCargo} label="Jovens com Cargo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-6">
        {/* Congregações */}
        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Distribuição por Congregação
              </h3>
              <p className="text-xs text-muted-foreground">
                Top 8 congregações por quantidade
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
              title="Ver todas"
              onClick={() => navigate("/admin/congregacoes")}
            >
              Ver todas <ArrowRight size={16} />
            </button>
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
                      width: total > 0 ? (count / total) * 100 + "%" : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

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
                        width: total > 0 ? (count / total) * 100 + "%" : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Faixa Etária */}
        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Faixa Etária
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribuição por idade (base: {total} registros)
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
                      width: total > 0 ? (count / total) * 100 + "%" : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Mantém só 1 resumo (remove "Com cargo") */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="rounded-xl bg-surface-2/60 border border-border px-3 py-2">
              <div className="text-xs text-muted-foreground">Média (aprox.)</div>
              <div className="text-base font-heading font-semibold text-foreground tabular-nums">
                {avgAge} anos
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Últimos Cadastros */}
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
