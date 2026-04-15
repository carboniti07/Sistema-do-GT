import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import { listJovens } from "../../lib/jovensApi";
import { congregacoes, getCongregacaoNome } from "../../lib/congregacoes";
import { Search, FileSpreadsheet, CalendarDays, Users, X, RefreshCcw } from "lucide-react";
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

function buildFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `UMADRUR_Jovens_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
}

function formatPhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value || "";
}

const simNaoOptions = (placeholder) => [
  { value: "", label: placeholder },
  { value: "Sim", label: "Sim" },
  { value: "Nao", label: "Não" },
];

const cargoOptions = [
  { value: "", label: "Cargo" },
  { value: "Sim", label: "Com cargo" },
  { value: "Nao", label: "Sem cargo" },
];

export default function Jovens() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filtCong, setFiltCong] = useState("");
  const [filtBatAguas, setFiltBatAguas] = useState("");
  const [filtBatES, setFiltBatES] = useState("");
  const [filtCargo, setFiltCargo] = useState("");
  const [jovens, setJovens] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewAll = hasPermission(user, Perms.VIEW_ALL);
  const isLimited = !canViewAll && hasPermission(user, Perms.VIEW_OWN_CONG);

  const congregacoesDoUsuario = useMemo(() => {
    const ids = Array.isArray(user?.congregacaoIds) ? user.congregacaoIds : [];
    return ids.map((id) => getCongregacaoNome(id)).filter(Boolean);
  }, [user]);

  const congOptions = useMemo(() => {
    if (isLimited) {
      return congregacoesDoUsuario.map((c) => ({ value: c, label: c }));
    }

    return [
      { value: "", label: "Todas Congregações" },
      ...congregacoes.map((c) => ({ value: c, label: c })),
    ];
  }, [isLimited, congregacoesDoUsuario]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await listJovens();
      setJovens(Array.isArray(data?.jovens) ? data.jovens : []);
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar jovens");
      setJovens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return jovens.filter((j) => {
      const congregacaoLabel = getCongregacaoNome(j.congregacaoId);

      if (search) {
        const term = search.toLowerCase();
        const nome = String(j.nome || "").toLowerCase();
        const telefone = String(j.telefone || "").toLowerCase();
        const congregacao = String(congregacaoLabel || "").toLowerCase();

        if (
          !nome.includes(term) &&
          !telefone.includes(term) &&
          !congregacao.includes(term)
        ) {
          return false;
        }
      }

      if (!isLimited && filtCong && congregacaoLabel !== filtCong) return false;
      if (filtBatAguas === "Sim" && !j.batismoAguas) return false;
      if (filtBatAguas === "Nao" && j.batismoAguas) return false;
      if (filtBatES === "Sim" && !j.batismoES) return false;
      if (filtBatES === "Nao" && j.batismoES) return false;
      if (filtCargo === "Sim" && !j.cargo) return false;
      if (filtCargo === "Nao" && j.cargo) return false;

      return true;
    });
  }, [jovens, search, filtCong, filtBatAguas, filtBatES, filtCargo, isLimited]);

  const totalAll = jovens.length;
  const totalFiltered = filtered.length;

  const columns = [
    { key: "nome", label: "Nome" },
    {
      key: "congregacaoId",
      label: "Congregação",
      render: (v) => getCongregacaoNome(v),
    },
    {
      key: "nascimento",
      label: "Idade",
      render: (v) => `${calcAge(v)} anos`,
    },
    {
      key: "telefone",
      label: "Telefone",
      render: (v) => formatPhone(v),
    },
    {
      key: "batismoAguas",
      label: "Bat. Águas",
      render: (v) => (v ? "Sim" : "Não"),
    },
    {
      key: "batismoES",
      label: "Bat. ES",
      render: (v) => (v ? "Sim" : "Não"),
    },
    { key: "cargo", label: "Cargo", render: (v) => v || "-" },
  ];

  const clearFilters = () => {
    setSearch("");
    setFiltCong("");
    setFiltBatAguas("");
    setFiltBatES("");
    setFiltCargo("");
  };

  const hasAnyFilter = !!(search || filtCong || filtBatAguas || filtBatES || filtCargo);

  const handleExport = async () => {
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import("exceljs"),
        import("file-saver"),
      ]);

      const wb = new ExcelJS.Workbook();
      wb.creator = "UMADRUR Connect";
      wb.created = new Date();

      const COLORS = {
        titleBg: "FFF3E8",
        headerBg: "FFF0E6",
        headerText: "FF7A1A",
        border: "FFE3D1",
        zebra: "FFFAF6",
        text: "FF111827",
        muted: "FF6B7280",
        soft: "FFF8F2",
      };

      const filtersText = `Congregação=${isLimited ? congregacoesDoUsuario.join(", ") || "Minha congregação" : filtCong || "Todas"} | Batismo Águas=${filtBatAguas || "Todos"} | Batismo ES=${filtBatES || "Todos"} | Cargo=${filtCargo || "Todos"} | Busca=${search || "-"}`;

      const wsS = wb.addWorksheet("Resumo", {
        views: [{ state: "frozen", ySplit: 3 }],
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      wsS.mergeCells("A1:E1");
      wsS.getCell("A1").value = "UMADRUR Connect | Exportação de Jovens";
      wsS.getCell("A1").font = { bold: true, size: 14, color: { argb: COLORS.text } };
      wsS.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.titleBg } };
      wsS.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
      wsS.getRow(1).height = 26;

      wsS.mergeCells("A2:E2");
      wsS.getCell("A2").value = `Gerado em: ${new Date().toLocaleString("pt-BR")}`;
      wsS.getCell("A2").font = { size: 10, color: { argb: COLORS.muted } };

      wsS.mergeCells("A3:E3");
      wsS.getCell("A3").value = `Filtros: ${filtersText}`;
      wsS.getCell("A3").font = { size: 10, color: { argb: COLORS.muted } };

      wsS.addRow([]);
      const headerResumo = wsS.addRow(["Indicador", "Valor", "", "Indicador", "Valor"]);
      headerResumo.eachCell((c) => {
        c.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        c.border = {
          top: { style: "thin", color: { argb: COLORS.border } },
          left: { style: "thin", color: { argb: COLORS.border } },
          bottom: { style: "thin", color: { argb: COLORS.border } },
          right: { style: "thin", color: { argb: COLORS.border } },
        };
        c.alignment = { vertical: "middle", horizontal: "left" };
      });

      const batAguasCount = filtered.filter((j) => j.batismoAguas).length;
      const batESCount = filtered.filter((j) => j.batismoES).length;
      const comCargoCount = filtered.filter((j) => j.cargo).length;

      const rowsResumo = [
        ["Total no sistema", totalAll, "", "Total filtrado", totalFiltered],
        ["Batizados nas águas", batAguasCount, "", "Batizados ES", batESCount],
        ["Com cargo", comCargoCount, "", "Gerado em", new Date().toLocaleDateString("pt-BR")],
      ];

      rowsResumo.forEach((r, idx) => {
        const row = wsS.addRow(r);
        row.height = 18;
        row.eachCell((c) => {
          c.font = { size: 11, color: { argb: COLORS.text } };
          c.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };
          c.alignment = { vertical: "middle", horizontal: "left" };
          if (idx % 2 === 0) {
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.soft } };
          }
        });
        row.getCell(2).alignment = { vertical: "middle", horizontal: "right" };
        row.getCell(5).alignment = { vertical: "middle", horizontal: "right" };
      });

      wsS.columns = [
        { width: 24 },
        { width: 14 },
        { width: 4 },
        { width: 24 },
        { width: 18 },
      ];

      const ws = wb.addWorksheet("Jovens", {
        views: [{ state: "frozen", ySplit: 5 }],
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      ws.mergeCells("A1:G1");
      ws.getCell("A1").value = "UMADRUR Connect | Relatório de Jovens";
      ws.getCell("A1").font = { bold: true, size: 14, color: { argb: COLORS.text } };
      ws.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.titleBg } };
      ws.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
      ws.getRow(1).height = 26;

      ws.mergeCells("A2:G2");
      ws.getCell("A2").value = `Gerado em: ${new Date().toLocaleString("pt-BR")}`;
      ws.getCell("A2").font = { size: 10, color: { argb: COLORS.muted } };

      ws.mergeCells("A3:G3");
      ws.getCell("A3").value = `Filtros: ${filtersText}`;
      ws.getCell("A3").font = { size: 10, color: { argb: COLORS.muted } };

      ws.mergeCells("A4:G4");
      ws.getCell("A4").value = `Total de registros exportados: ${filtered.length}`;
      ws.getCell("A4").font = { bold: true, size: 10, color: { argb: COLORS.text } };

      ws.addRow([]);

      const headers = ["Nome", "Congregação", "Idade", "Telefone", "Batizado nas Águas", "Batizado ES", "Cargo"];
      const headerRow = ws.addRow(headers);

      headerRow.height = 18;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
        cell.border = {
          top: { style: "thin", color: { argb: COLORS.border } },
          left: { style: "thin", color: { argb: COLORS.border } },
          bottom: { style: "thin", color: { argb: COLORS.border } },
          right: { style: "thin", color: { argb: COLORS.border } },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });

      ws.columns = [
        { width: 28 },
        { width: 30 },
        { width: 10 },
        { width: 16 },
        { width: 18 },
        { width: 14 },
        { width: 18 },
      ];

      ws.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: headerRow.number, column: headers.length },
      };

      filtered.forEach((j, idx) => {
        const row = ws.addRow([
          j.nome,
          getCongregacaoNome(j.congregacaoId),
          calcAge(j.nascimento),
          formatPhone(j.telefone),
          j.batismoAguas ? "Sim" : "Não",
          j.batismoES ? "Sim" : "Não",
          j.cargo || "-",
        ]);

        row.height = 18;
        row.eachCell((cell) => {
          cell.font = { size: 11, color: { argb: COLORS.text } };
          cell.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
          if (idx % 2 === 0) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.zebra } };
          }
        });

        row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(6).alignment = { vertical: "middle", horizontal: "center" };
      });

      ws.addRow([]);
      const footer = ws.addRow(["Relatório gerado automaticamente | UMADRUR Connect", "", "", "", "", "", ""]);
      ws.mergeCells(`A${footer.number}:G${footer.number}`);
      ws.getCell(`A${footer.number}`).font = { size: 10, color: { argb: COLORS.muted } };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, buildFileName());
    } catch (err) {
      toast.error(err?.message || "Erro ao exportar Excel");
    }
  };

  return (
    <AdminLayout title="Jovens">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Jovens
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLimited ? "Lista da sua congregação" : "Lista e filtros"}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <CalendarDays size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{formatTodayPtBR()}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrados</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {loading ? "..." : `${totalFiltered}/${totalAll}`}
            </span>
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

      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou congregação..."
              className="input-field pl-10"
            />
          </div>

          <Button onClick={handleExport} disabled={loading || !filtered.length}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </Button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">
            Filtros
          </span>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Limpar filtros"
            >
              <X size={16} />
              Limpar filtros
            </button>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isLimited ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-3 mb-6`}>
          {!isLimited && (
            <SelectField
              value={congOptions.find((o) => o.value === filtCong) || congOptions[0]}
              onChange={(opt) => setFiltCong(opt?.value || "")}
              options={congOptions}
              placeholder="Todas Congregações"
            />
          )}

          <SelectField
            value={
              simNaoOptions("Batismo nas Águas").find((o) => o.value === filtBatAguas) ||
              simNaoOptions("Batismo nas Águas")[0]
            }
            onChange={(opt) => setFiltBatAguas(opt?.value || "")}
            options={simNaoOptions("Batismo nas Águas")}
            placeholder="Batismo nas Águas"
          />

          <SelectField
            value={
              simNaoOptions("Batismo ES").find((o) => o.value === filtBatES) ||
              simNaoOptions("Batismo ES")[0]
            }
            onChange={(opt) => setFiltBatES(opt?.value || "")}
            options={simNaoOptions("Batismo ES")}
            placeholder="Batismo ES"
          />

          <SelectField
            value={cargoOptions.find((o) => o.value === filtCargo) || cargoOptions[0]}
            onChange={(opt) => setFiltCargo(opt?.value || "")}
            options={cargoOptions}
            placeholder="Cargo"
          />
        </div>

        <Table columns={columns} data={filtered} />
      </Card>
    </AdminLayout>
  );
}