import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import Table from "../../components/Table";
import { listAdolescentes } from "../../lib/adolescentesApi.js";
import {
  Users,
  Droplets,
  Sparkles,
  RefreshCcw,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  ImageIcon,
  MessageCircle,
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

function booleanLabel(value) {
  return value ? "Sim" : "Não";
}

function formatPhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value || "-";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [adolescentes, setAdolescentes] = useState([]);
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

      const data = await listAdolescentes();

      setAdolescentes(
        Array.isArray(data?.adolescentes) ? data.adolescentes : []
      );
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar dashboard");
      setAdolescentes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const total = adolescentes.length;

  const batAguas = adolescentes.filter(
    (adolescente) => adolescente.batismoAguas
  ).length;

  const batES = adolescentes.filter(
    (adolescente) => adolescente.batismoES
  ).length;

  const autorizaParticipacao = adolescentes.filter(
    (adolescente) => adolescente.autorizaParticipacao
  ).length;

  const autorizaImagem = adolescentes.filter(
    (adolescente) => adolescente.autorizaImagem
  ).length;

  const autorizaWhatsApp = adolescentes.filter(
    (adolescente) => adolescente.autorizaWhatsApp
  ).length;

  const congDist = {};

  adolescentes.forEach((adolescente) => {
    const label = getCongregacaoNome(adolescente.congregacaoId);
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

  const ageRanges = {
    "Até 12": 0,
    "13-14": 0,
    "15-16": 0,
  };

  adolescentes.forEach((adolescente) => {
    const age = calcAge(adolescente.nascimento);

    if (age <= 0) return;

    if (age <= 12) ageRanges["Até 12"]++;
    else if (age <= 14) ageRanges["13-14"]++;
    else if (age <= 16) ageRanges["15-16"]++;
  });

  const recent = [...adolescentes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentColumns = [
    { key: "nome", label: "Nome" },
    {
      key: "congregacaoId",
      label: "Congregação",
      render: (value) => getCongregacaoNome(value),
    },
    {
      key: "responsavelNome",
      label: "Responsável",
      render: (value, row) => {
        const nome = value || "-";
        const parentesco = row.responsavelParentesco
          ? ` (${row.responsavelParentesco})`
          : "";

        return `${nome}${parentesco}`;
      },
    },
    {
      key: "responsavelTelefone",
      label: "Tel. Resp.",
      render: (value) => formatPhone(value),
    },
    {
      key: "createdAt",
      label: "Data",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("pt-BR") : "",
    },
  ];

  const todayLabel = useMemo(() => formatTodayPtBR(), []);

  const topCongEntries = useMemo(() => {
    return [...congEntries]
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 8);
  }, [congEntries]);

  const avgAge = useMemo(() => {
    if (!total) return 0;

    const validAges = adolescentes
      .map((adolescente) => calcAge(adolescente.nascimento))
      .filter((age) => age > 0);

    if (!validAges.length) return 0;

    const sum = validAges.reduce((acc, age) => acc + age, 0);

    return Math.round(sum / validAges.length);
  }, [adolescentes, total]);

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
              : "Resumo geral e indicadores do Geração Teen"}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4 mb-4 md:mb-6">
        <StatCard
          icon={Users}
          value={loading ? "..." : total}
          label="Total de Adolescentes"
        />

        <StatCard
          icon={Droplets}
          value={loading ? "..." : batAguas}
          label="Batizados nas Águas"
        />

        <StatCard
          icon={Sparkles}
          value={loading ? "..." : batES}
          label="Batizados com Espírito Santo"
        />

        <StatCard
          icon={CheckCircle2}
          value={loading ? "..." : autorizaParticipacao}
          label="Participação autorizada"
        />

        <StatCard
          icon={ImageIcon}
          value={loading ? "..." : autorizaImagem}
          label="Imagem autorizada"
        />

        <StatCard
          icon={MessageCircle}
          value={loading ? "..." : autorizaWhatsApp}
          label="WhatsApp autorizado"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-6">
        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Distribuição por Congregação
              </h3>

              <p className="text-xs text-muted-foreground">
                {isLimited
                  ? "Sua congregação"
                  : "Top 8 congregações por quantidade"}
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
                  <span className="text-muted-foreground tabular-nums">
                    {count}
                  </span>
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
        </Card>

        <Card className="min-h-[320px]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base">
                Faixa Etária
              </h3>

              <p className="text-xs text-muted-foreground">
                Distribuição por idade, base: {loading ? "..." : total} registros
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(ageRanges).map(([range, count]) => (
              <div key={range} className="group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{range} anos</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {count}
                  </span>
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
              <div className="text-xs text-muted-foreground">
                Média aproximada
              </div>

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

            <p className="text-xs text-muted-foreground">
              Exibindo os 5 mais recentes
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80 transition-opacity"
            title="Ver todos"
            onClick={() => navigate("/admin/adolescentes")}
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        <div className="-mx-2 sm:mx-0">
          <div className="overflow-x-auto px-2 sm:px-0">
            <div className="min-w-[900px]">
              <Table columns={recentColumns} data={recent} />
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}