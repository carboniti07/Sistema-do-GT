import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import StatCard from "../../components/StatCard";
import {
  Building2,
  Users,
  Droplets,
  Sparkles,
  Copy,
  Info,
  RefreshCcw,
  CheckCircle2,
  ImageIcon,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import { listAdolescentes } from "../../lib/adolescentesApi.js";
import { congregacoes, getCongregacaoNome } from "../../lib/congregacoes";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
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

function booleanLabel(value) {
  return value ? "Sim" : "Não";
}

function percent(value, total) {
  if (!total) return "0%";

  return `${Math.min(100, (value / total) * 100)}%`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  } catch {
    toast.error("Não foi possível copiar");
  }
}

export default function Congregacoes() {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [adolescentes, setAdolescentes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const data = await listAdolescentes();

      setAdolescentes(
        Array.isArray(data?.adolescentes) ? data.adolescentes : []
      );
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar congregações");
      setAdolescentes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    return congregacoes.map((key) => {
      const adolescentesDaCongregacao = adolescentes.filter(
        (adolescente) => getCongregacaoNome(adolescente.congregacaoId) === key
      );

      const total = adolescentesDaCongregacao.length;

      const batAguas = adolescentesDaCongregacao.filter(
        (adolescente) => adolescente.batismoAguas
      ).length;

      const batES = adolescentesDaCongregacao.filter(
        (adolescente) => adolescente.batismoES
      ).length;

      const autorizaParticipacao = adolescentesDaCongregacao.filter(
        (adolescente) => adolescente.autorizaParticipacao
      ).length;

      const autorizaImagem = adolescentesDaCongregacao.filter(
        (adolescente) => adolescente.autorizaImagem
      ).length;

      const autorizaWhatsApp = adolescentesDaCongregacao.filter(
        (adolescente) => adolescente.autorizaWhatsApp
      ).length;

      return {
        key,
        congregacao: key,
        total,
        batAguas,
        batES,
        autorizaParticipacao,
        autorizaImagem,
        autorizaWhatsApp,
      };
    });
  }, [adolescentes]);

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

  const columns = [
    { key: "congregacao", label: "Congregação" },
    { key: "total", label: "Total" },
    { key: "batAguas", label: "Bat. Águas" },
    { key: "batES", label: "Bat. E.S." },
    { key: "autorizaParticipacao", label: "Participação" },
    { key: "autorizaImagem", label: "Imagem" },
    { key: "autorizaWhatsApp", label: "WhatsApp" },
  ];

  function openDetails(key) {
    setSelectedKey(key);
    setOpen(true);
  }

  const selectedData = useMemo(() => {
    if (!selectedKey) return null;

    const adolescentesDaCongregacao = adolescentes.filter(
      (adolescente) =>
        getCongregacaoNome(adolescente.congregacaoId) === selectedKey
    );

    const total = adolescentesDaCongregacao.length;

    const batAguas = adolescentesDaCongregacao.filter(
      (adolescente) => adolescente.batismoAguas
    ).length;

    const batES = adolescentesDaCongregacao.filter(
      (adolescente) => adolescente.batismoES
    ).length;

    const autorizaParticipacao = adolescentesDaCongregacao.filter(
      (adolescente) => adolescente.autorizaParticipacao
    ).length;

    const autorizaImagem = adolescentesDaCongregacao.filter(
      (adolescente) => adolescente.autorizaImagem
    ).length;

    const autorizaWhatsApp = adolescentesDaCongregacao.filter(
      (adolescente) => adolescente.autorizaWhatsApp
    ).length;

    const semParticipacaoAutorizada =
      total > 0 ? total - autorizaParticipacao : 0;

    const semImagemAutorizada = total > 0 ? total - autorizaImagem : 0;

    const semWhatsAppAutorizado = total > 0 ? total - autorizaWhatsApp : 0;

    const recent = [...adolescentesDaCongregacao]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    return {
      total,
      batAguas,
      batES,
      autorizaParticipacao,
      autorizaImagem,
      autorizaWhatsApp,
      semParticipacaoAutorizada,
      semImagemAutorizada,
      semWhatsAppAutorizado,
      recent,
    };
  }, [selectedKey, adolescentes]);

  const actions = (row) => (
    <div className="flex gap-2">
      <button
        onClick={() => copyToClipboard(row.key)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors inline-flex items-center gap-2"
        title="Copiar nome da congregação"
        type="button"
      >
        <Copy size={14} />
        Copiar
      </button>

      <button
        onClick={() => openDetails(row.key)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-2"
        title="Ver detalhes"
        type="button"
      >
        <Info size={14} />
        Detalhes
      </button>
    </div>
  );

  return (
    <AdminLayout title="Congregações">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Building2}
            value={loading ? "..." : congregacoes.length}
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

        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                Listagem por congregação
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                Visualização de cadastros, batismos e autorizações por congregação.
              </p>
            </div>
          </div>

          <Table columns={columns} data={rows} actions={actions} />
        </Card>

        <Modal open={open} onClose={() => setOpen(false)} title="Congregação">
          {!selectedKey || !selectedData ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-xs text-muted-foreground">
                        Congregação
                      </p>
                    </div>

                    <h4 className="mt-1 text-lg font-heading font-semibold text-foreground truncate">
                      {selectedKey}
                    </h4>
                  </div>

                  <button
                    onClick={() => copyToClipboard(selectedKey)}
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity inline-flex items-center gap-2"
                    title="Copiar"
                    type="button"
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Total", value: selectedData.total },
                    { label: "Bat. Águas", value: selectedData.batAguas },
                    { label: "Bat. E.S.", value: selectedData.batES },
                    {
                      label: "Participação",
                      value: selectedData.autorizaParticipacao,
                    },
                    { label: "Imagem", value: selectedData.autorizaImagem },
                    { label: "WhatsApp", value: selectedData.autorizaWhatsApp },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {item.label}
                      </div>

                      <div className="mt-1 text-2xl font-heading font-semibold text-foreground tabular-nums leading-none">
                        {item.value}
                      </div>

                      <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{
                            width: percent(item.value, selectedData.total),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-heading font-semibold text-foreground">
                      Último cadastro
                    </h5>

                    <span className="text-xs text-muted-foreground">
                      {selectedData.recent.length ? "mais recente" : ""}
                    </span>
                  </div>

                  {selectedData.recent.length === 0 ? (
                    <div className="mt-4 text-sm text-muted-foreground">
                      Sem registros nesta congregação.
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-border bg-surface-2/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-foreground truncate">
                            {selectedData.recent[0].nome}
                          </div>

                          <div className="mt-1 text-sm text-muted-foreground truncate">
                            {formatPhone(selectedData.recent[0].telefone)}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground truncate">
                            Responsável:{" "}
                            {selectedData.recent[0].responsavelNome || "-"}
                          </div>
                        </div>

                        <div className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {formatDate(selectedData.recent[0].createdAt)}
                        </div>
                      </div>

                      <div className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Cadastro recente
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-heading font-semibold text-foreground">
                      Autorizações pendentes
                    </h5>

                    <span className="text-xs text-muted-foreground">
                      total por tipo
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <AuthorizationRow
                      icon={CheckCircle2}
                      label="Sem autorização de participação"
                      value={selectedData.semParticipacaoAutorizada}
                      total={selectedData.total}
                    />

                    <AuthorizationRow
                      icon={ImageIcon}
                      label="Sem autorização de imagem"
                      value={selectedData.semImagemAutorizada}
                      total={selectedData.total}
                    />

                    <AuthorizationRow
                      icon={MessageCircle}
                      label="Sem autorização de WhatsApp"
                      value={selectedData.semWhatsAppAutorizado}
                      total={selectedData.total}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="h-10 px-5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-surface-2 transition-colors"
                  type="button"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

function AuthorizationRow({ icon: Icon, label, value, total }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">{label}</span>
        </div>

        <span className="text-sm font-semibold text-foreground tabular-nums">
          {value}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{
            width: percent(value, total),
          }}
        />
      </div>
    </div>
  );
}