import React, { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import StatCard from "../../components/StatCard";
import { Building2, Users, Droplets, Sparkles, Shield, Copy, Info } from "lucide-react";
import { toast } from "sonner";

import { mockJovens } from "../../lib/mockData";
import { congregacoes } from "../../lib/congregacoes";

function formatDate(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
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

  const rows = useMemo(() => {
    return congregacoes.map((key) => {
      const jovens = mockJovens.filter((j) => j.congregacao === key);

      const total = jovens.length;
      const batAguas = jovens.filter((j) => j.batismoAguas).length;
      const batES = jovens.filter((j) => j.batismoES).length;
      const comCargo = jovens.filter((j) => j.cargo).length;

      return {
        key,
        congregacao: key,
        total,
        batAguas,
        batES,
        comCargo,
      };
    });
  }, []);

  const totals = useMemo(() => {
    const total = mockJovens.length;
    const batAguas = mockJovens.filter((j) => j.batismoAguas).length;
    const batES = mockJovens.filter((j) => j.batismoES).length;
    const comCargo = mockJovens.filter((j) => j.cargo).length;
    return { total, batAguas, batES, comCargo };
  }, []);

  const columns = [
    { key: "congregacao", label: "Congregação" },
    { key: "total", label: "Total" },
    { key: "batAguas", label: "Bat. Águas" },
    { key: "batES", label: "Bat. E.S." },
    { key: "comCargo", label: "Com cargo" },
  ];

  const openDetails = (key) => {
    setSelectedKey(key);
    setOpen(true);
  };

  const selectedData = useMemo(() => {
    if (!selectedKey) return null;

    const jovens = mockJovens.filter((j) => j.congregacao === selectedKey);

    const total = jovens.length;
    const batAguas = jovens.filter((j) => j.batismoAguas).length;
    const batES = jovens.filter((j) => j.batismoES).length;
    const comCargo = jovens.filter((j) => j.cargo).length;

    // últimos 5 cadastros (por dataCadastro)
    const recent = [...jovens]
      .sort((a, b) => new Date(b.dataCadastro || 0) - new Date(a.dataCadastro || 0))
      .slice(0, 5);

    // top cargos (até 3)
    const cargoCount = {};
    jovens.forEach((j) => {
      if (!j.cargo) return;
      cargoCount[j.cargo] = (cargoCount[j.cargo] || 0) + 1;
    });

    const topCargos = Object.entries(cargoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { total, batAguas, batES, comCargo, recent, topCargos };
  }, [selectedKey]);

  const actions = (row) => (
    <div className="flex gap-2">
      <button
        onClick={() => copyToClipboard(row.key)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors inline-flex items-center gap-2"
        title="Copiar nome da congregação"
      >
        <Copy size={14} />
        Copiar
      </button>

      <button
        onClick={() => openDetails(row.key)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-2"
        title="Ver detalhes"
      >
        <Info size={14} />
        Detalhes
      </button>
    </div>
  );

  return (
    <AdminLayout title="Congregações">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Building2} value={congregacoes.length} label="Congregações" />
          <StatCard icon={Users} value={totals.total} label="Total de jovens" />
          <StatCard icon={Droplets} value={totals.batAguas} label="Batizados nas Águas" />
          <StatCard icon={Sparkles} value={totals.batES} label="Batizados com Espírito Santo" />
          <StatCard icon={Shield} value={totals.comCargo} label="Com cargo" />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                Listagem por congregação
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Visualização e ações rápidas (copiar e detalhes).
              </p>
            </div>
          </div>

          <Table columns={columns} data={rows} actions={actions} />
        </Card>

       {/* ✅ SUBSTITUA O CONTEÚDO DO Modal por este (mais “premium”, espaçado e na paleta) */}
<Modal open={open} onClose={() => setOpen(false)} title="Congregação">
  {!selectedKey || !selectedData ? (
    <div className="text-sm text-muted-foreground">Carregando...</div>
  ) : (
    <div className="space-y-5">
      {/* Header com destaque na paleta */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-xs text-muted-foreground">Congregação</p>
            </div>

            <h4 className="mt-1 text-lg font-heading font-semibold text-foreground truncate">
              {selectedKey}
            </h4>
          </div>

          <button
            onClick={() => copyToClipboard(selectedKey)}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity inline-flex items-center gap-2"
            title="Copiar"
          >
            <Copy size={16} />
            Copiar
          </button>
        </div>

        {/* Chips (bem clean e na paleta) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: selectedData.total },
            { label: "Bat. Águas", value: selectedData.batAguas },
            { label: "Bat. E.S.", value: selectedData.batES },
            { label: "Com cargo", value: selectedData.comCargo },
          ].map((it) => (
            <div
              key={it.label}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="text-[11px] text-muted-foreground">{it.label}</div>
              <div className="mt-1 text-2xl font-heading font-semibold text-foreground tabular-nums leading-none">
                {it.value}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{
                    width:
                      selectedData.total > 0
                        ? Math.min(100, (it.value / selectedData.total) * 100) + "%"
                        : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corpo: 2 cards bem organizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Último cadastro */}
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
                    {selectedData.recent[0].telefone || "-"}
                  </div>
                </div>

                <div className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {formatDate(selectedData.recent[0].dataCadastro)}
                </div>
              </div>

              {/* badge discreto na paleta */}
              <div className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Cadastro recente
              </div>
            </div>
          )}
        </div>

        {/* Cargo mais comum */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-heading font-semibold text-foreground">
              Cargo mais comum
            </h5>
            <span className="text-xs text-muted-foreground">
              {selectedData.topCargos.length ? "top 1" : ""}
            </span>
          </div>

          {selectedData.topCargos.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              Nenhum cargo cadastrado.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-border bg-surface-2/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-foreground truncate">
                    {selectedData.topCargos[0][0]}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Pessoas com esse cargo
                  </div>
                </div>

                <div className="shrink-0 text-2xl font-heading font-semibold text-foreground tabular-nums">
                  {selectedData.topCargos[0][1]}
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{
                    width:
                      selectedData.total > 0
                        ? Math.min(
                            100,
                            (selectedData.topCargos[0][1] / selectedData.total) * 100
                          ) + "%"
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(false)}
          className="h-10 px-5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-surface-2 transition-colors"
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
