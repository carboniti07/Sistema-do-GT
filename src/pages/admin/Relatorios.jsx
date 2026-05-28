import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import {
  Users,
  Droplets,
  Sparkles,
  BarChart3,
  Building2,
  RefreshCcw,
  CheckCircle2,
  ImageIcon,
  MessageCircle,
} from "lucide-react";
import { listAdolescentes } from "../../lib/adolescentesApi.js";
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
      toast.error(err?.message || "Erro ao carregar relatórios");
      setAdolescentes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
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

    return {
      total,
      batAguas,
      batES,
      autorizaParticipacao,
      autorizaImagem,
      autorizaWhatsApp,
    };
  }, [adolescentes]);

  const cadastrosPorMes = useMemo(() => {
    const map = {};

    adolescentes.forEach((adolescente) => {
      const k = monthKey(adolescente.createdAt || adolescente.dataCadastro);

      if (!isValidMonth(k)) return;

      map[k] = (map[k] || 0) + 1;
    });

    const keys = Object.keys(map).sort();

    return keys.map((k) => ({
      mes: monthLabel(k),
      cadastros: map[k],
    }));
  }, [adolescentes]);

  const porCongregacao = useMemo(() => {
    const base = congregacoesVisiveis;
    const map = {};

    base.forEach((congregacao) => {
      map[congregacao] = 0;
    });

    adolescentes.forEach((adolescente) => {
      const nome = getCongregacaoNome(adolescente.congregacaoId);
      map[nome] = (map[nome] || 0) + 1;
    });

    return base
      .map((congregacao) => ({
        congregacao,
        total: map[congregacao] || 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [adolescentes, congregacoesVisiveis]);

  const top10Cong = useMemo(
    () => porCongregacao.slice(0, 10),
    [porCongregacao]
  );

  const recortes = useMemo(() => {
    const total = adolescentes.length;

    const batAguasSim = adolescentes.filter(
      (adolescente) => adolescente.batismoAguas
    ).length;

    const batESSim = adolescentes.filter(
      (adolescente) => adolescente.batismoES
    ).length;

    const participacaoSim = adolescentes.filter(
      (adolescente) => adolescente.autorizaParticipacao
    ).length;

    const imagemSim = adolescentes.filter(
      (adolescente) => adolescente.autorizaImagem
    ).length;

    const whatsappSim = adolescentes.filter(
      (adolescente) => adolescente.autorizaWhatsApp
    ).length;

    return {
      batAguasSim,
      batAguasNao: total - batAguasSim,

      batESSim,
      batESNao: total - batESSim,

      participacaoSim,
      participacaoNao: total - participacaoSim,

      imagemSim,
      imagemNao: total - imagemSim,

      whatsappSim,
      whatsappNao: total - whatsappSim,
    };
  }, [adolescentes]);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard
            icon={Building2}
            value={loading ? "..." : congregacoesVisiveis.length}
            label="Congregações"
          />

          <StatCard
            icon={Users}
            value={loading ? "..." : totals.total}
            label="Total de adolescentes"
          />

          <StatCard
            icon={Droplets}
            value={loading ? "..." : totals.batAguas}
            label="Batizados nas Águas"
          />

          <StatCard
            icon={Sparkles}
            value={loading ? "..." : totals.batES}
            label="Batizados com Espírito Santo"
          />

          <StatCard
            icon={CheckCircle2}
            value={loading ? "..." : totals.autorizaParticipacao}
            label="Participação autorizada"
          />

          <StatCard
            icon={ImageIcon}
            value={loading ? "..." : totals.autorizaImagem}
            label="Imagem autorizada"
          />
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
                  <LineChart
                    data={cadastrosPorMes}
                    margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
                    <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip labelPrefix="Mês" />} />
                    <Line
                      type="monotone"
                      dataKey="cadastros"
                      stroke={PRIMARY}
                      strokeWidth={3}
                      dot={{
                        r: 3,
                        stroke: PRIMARY,
                        strokeWidth: 2,
                        fill: "hsl(var(--card))",
                      }}
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
                    : "Distribuição de cadastros entre as congregações, Top 10."}
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
                  <BarChart
                    data={top10Cong}
                    margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
                  >
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
            Indicadores, resumo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <ResumoItem
              title="Batismo nas Águas"
              sim={recortes.batAguasSim}
              nao={recortes.batAguasNao}
            />

            <ResumoItem
              title="Batismo com Espírito Santo"
              sim={recortes.batESSim}
              nao={recortes.batESNao}
            />

            <ResumoItem
              title="Participação nas atividades"
              sim={recortes.participacaoSim}
              nao={recortes.participacaoNao}
            />

            <ResumoItem
              title="Uso de imagem"
              sim={recortes.imagemSim}
              nao={recortes.imagemNao}
            />

            <ResumoItem
              title="Contato por WhatsApp"
              sim={recortes.whatsappSim}
              nao={recortes.whatsappNao}
            />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ResumoItem({ title, sim, nao }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground mb-2">{title}</p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sim</span>
        <span className="text-foreground font-semibold tabular-nums">{sim}</span>
      </div>

      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Não</span>
        <span className="text-foreground font-semibold tabular-nums">{nao}</span>
      </div>
    </div>
  );
}