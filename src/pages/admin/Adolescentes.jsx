import React, { useState, useMemo, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout.jsx";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import Button from "../../components/Button.jsx";
import SelectField from "../../components/SelectField.jsx";
import Input from "../../components/Input.jsx";
import Modal from "../../components/Modal.jsx";
import {
  listAdolescentes,
  updateAdolescente,
  deleteAdolescente,
} from "../../lib/adolescentesApi.js";
import { congregacoes, getCongregacaoNome } from "../../lib/congregacoes.js";
import {
  Search,
  FileSpreadsheet,
  CalendarDays,
  Users,
  X,
  RefreshCcw,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Perms } from "../../auth/permissions.js";
import { hasPermission } from "../../auth/hasPermission.js";

const parentescoOptions = [
  { value: "Mãe", label: "Mãe" },
  { value: "Pai", label: "Pai" },
  { value: "Avó", label: "Avó" },
  { value: "Avô", label: "Avô" },
  { value: "Tia", label: "Tia" },
  { value: "Tio", label: "Tio" },
  { value: "Irmã maior de idade", label: "Irmã maior de idade" },
  { value: "Irmão maior de idade", label: "Irmão maior de idade" },
  { value: "Tutor legal", label: "Tutor legal" },
  { value: "Guardião", label: "Guardião" },
  { value: "Dirigente responsável", label: "Dirigente responsável" },
  { value: "Outro", label: "Outro" },
];

const sexoOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
];

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

  return `Geracao_Teen_Adolescentes_${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}.xlsx`;
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

function onlyDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function safeMaskedCpf(value = "") {
  const text = String(value || "").trim();

  if (!text || text === "***.***.***-**") {
    return "-";
  }

  return text;
}

function formatDateBR(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("pt-BR");
}

function toDateInputValue(date) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

function booleanLabel(value) {
  return value ? "Sim" : "Não";
}

function booleanToSelect(value) {
  return {
    value: value ? "Sim" : "Nao",
    label: value ? "Sim" : "Não",
  };
}

function selectToBoolean(value) {
  return value === "Sim";
}

const simNaoOptions = (placeholder) => [
  { value: "", label: placeholder },
  { value: "Sim", label: "Sim" },
  { value: "Nao", label: "Não" },
];

export default function Adolescentes() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filtCong, setFiltCong] = useState("");
  const [filtBatAguas, setFiltBatAguas] = useState("");
  const [filtBatES, setFiltBatES] = useState("");
  const [filtAutorizaParticipacao, setFiltAutorizaParticipacao] = useState("");
  const [filtAutorizaImagem, setFiltAutorizaImagem] = useState("");
  const [filtAutorizaWhatsApp, setFiltAutorizaWhatsApp] = useState("");

  const [adolescentes, setAdolescentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedAdolescente, setSelectedAdolescente] = useState(null);
  const [editingAdolescente, setEditingAdolescente] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");

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

      const data = await listAdolescentes();

      setAdolescentes(
        Array.isArray(data?.adolescentes) ? data.adolescentes : []
      );
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar adolescentes");
      setAdolescentes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return adolescentes.filter((adolescente) => {
      const congregacaoLabel = getCongregacaoNome(adolescente.congregacaoId);

      if (search) {
        const term = search.toLowerCase();

        const searchable = [
          adolescente.nome,
          adolescente.telefone,
          congregacaoLabel,
          adolescente.nomeMae,
          adolescente.telefoneMae,
          adolescente.nomePai,
          adolescente.telefonePai,
          adolescente.responsavelNome,
          adolescente.responsavelParentesco,
          adolescente.responsavelTelefone,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");

        if (!searchable.includes(term)) {
          return false;
        }
      }

      if (!isLimited && filtCong && congregacaoLabel !== filtCong) return false;

      if (filtBatAguas === "Sim" && !adolescente.batismoAguas) return false;
      if (filtBatAguas === "Nao" && adolescente.batismoAguas) return false;

      if (filtBatES === "Sim" && !adolescente.batismoES) return false;
      if (filtBatES === "Nao" && adolescente.batismoES) return false;

      if (
        filtAutorizaParticipacao === "Sim" &&
        !adolescente.autorizaParticipacao
      ) {
        return false;
      }

      if (
        filtAutorizaParticipacao === "Nao" &&
        adolescente.autorizaParticipacao
      ) {
        return false;
      }

      if (filtAutorizaImagem === "Sim" && !adolescente.autorizaImagem) {
        return false;
      }

      if (filtAutorizaImagem === "Nao" && adolescente.autorizaImagem) {
        return false;
      }

      if (filtAutorizaWhatsApp === "Sim" && !adolescente.autorizaWhatsApp) {
        return false;
      }

      if (filtAutorizaWhatsApp === "Nao" && adolescente.autorizaWhatsApp) {
        return false;
      }

      return true;
    });
  }, [
    adolescentes,
    search,
    filtCong,
    filtBatAguas,
    filtBatES,
    filtAutorizaParticipacao,
    filtAutorizaImagem,
    filtAutorizaWhatsApp,
    isLimited,
  ]);

  const totalAll = adolescentes.length;
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
      key: "responsavelNome",
      label: "Responsável",
      render: (v, row) => {
        const nome = v || "-";
        const parentesco = row.responsavelParentesco
          ? ` (${row.responsavelParentesco})`
          : "";

        return `${nome}${parentesco}`;
      },
    },
    {
      key: "responsavelTelefone",
      label: "Tel. Resp.",
      render: (v) => formatPhone(v),
    },
    {
      key: "autorizaParticipacao",
      label: "Participação",
      render: (v) => booleanLabel(v),
    },
    {
      key: "autorizaImagem",
      label: "Imagem",
      render: (v) => booleanLabel(v),
    },
    {
      key: "acoes",
      label: "Ações",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedAdolescente(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
            title="Ver detalhes"
          >
            <Eye size={17} />
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingAdolescente({
                ...row,
                nascimento: toDateInputValue(row.nascimento),
              })
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
            title="Editar"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Excluir"
            disabled={deletingId === row.id}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setFiltCong("");
    setFiltBatAguas("");
    setFiltBatES("");
    setFiltAutorizaParticipacao("");
    setFiltAutorizaImagem("");
    setFiltAutorizaWhatsApp("");
  };

  const hasAnyFilter = !!(
    search ||
    filtCong ||
    filtBatAguas ||
    filtBatES ||
    filtAutorizaParticipacao ||
    filtAutorizaImagem ||
    filtAutorizaWhatsApp
  );

  async function handleDelete(row) {
    const ok = window.confirm(`Deseja excluir "${row.nome}"?`);

    if (!ok) return;

    try {
      setDeletingId(row.id);
      await deleteAdolescente(row.id);

      toast.success("Adolescente excluído com sucesso");

      await loadData();

      if (selectedAdolescente?.id === row.id) {
        setSelectedAdolescente(null);
      }
    } catch (err) {
      toast.error(err?.message || "Erro ao excluir adolescente");
    } finally {
      setDeletingId("");
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();

    if (!editingAdolescente) return;

    try {
      setSavingEdit(true);

      await updateAdolescente(editingAdolescente.id, {
        nome: editingAdolescente.nome,
        nascimento: editingAdolescente.nascimento,
        sexo: editingAdolescente.sexo,
        telefone: onlyDigits(editingAdolescente.telefone),

        nomeMae: editingAdolescente.nomeMae || "",
        telefoneMae: onlyDigits(editingAdolescente.telefoneMae),
        nomePai: editingAdolescente.nomePai || "",
        telefonePai: onlyDigits(editingAdolescente.telefonePai),

        responsavelNome: editingAdolescente.responsavelNome || "",
        responsavelParentesco: editingAdolescente.responsavelParentesco || "",
        responsavelTelefone: onlyDigits(editingAdolescente.responsavelTelefone),

        cep: onlyDigits(editingAdolescente.cep),
        logradouro: editingAdolescente.logradouro || "",
        numero: editingAdolescente.numero || "",
        complemento: editingAdolescente.complemento || "",
        bairro: editingAdolescente.bairro || "",
        cidade: editingAdolescente.cidade || "",
        uf: editingAdolescente.uf || "",

        batismoAguas: !!editingAdolescente.batismoAguas,
        batismoES: !!editingAdolescente.batismoES,

        autorizaParticipacao: !!editingAdolescente.autorizaParticipacao,
        autorizaImagem: !!editingAdolescente.autorizaImagem,
        autorizaWhatsApp: !!editingAdolescente.autorizaWhatsApp,
        observacoesResponsavel:
          editingAdolescente.observacoesResponsavel || "",
        lgpdResponsavel: !!editingAdolescente.lgpdResponsavel,
      });

      toast.success("Adolescente atualizado com sucesso");
      setEditingAdolescente(null);

      await loadData();
    } catch (err) {
      toast.error(err?.message || "Erro ao atualizar adolescente");
    } finally {
      setSavingEdit(false);
    }
  }

  const handleExport = async () => {
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import("exceljs"),
        import("file-saver"),
      ]);

      const wb = new ExcelJS.Workbook();

      wb.creator = "Geração Teen";
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

      const filtersText = `Congregação=${
        isLimited
          ? congregacoesDoUsuario.join(", ") || "Minha congregação"
          : filtCong || "Todas"
      } | Batismo Águas=${filtBatAguas || "Todos"} | Batismo ES=${
        filtBatES || "Todos"
      } | Participação=${
        filtAutorizaParticipacao || "Todos"
      } | Imagem=${filtAutorizaImagem || "Todos"} | WhatsApp=${
        filtAutorizaWhatsApp || "Todos"
      } | Busca=${search || "-"}`;

      const wsS = wb.addWorksheet("Resumo", {
        views: [{ state: "frozen", ySplit: 3 }],
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      wsS.mergeCells("A1:E1");
      wsS.getCell("A1").value =
        "Geração Teen | Exportação de Adolescentes";
      wsS.getCell("A1").font = {
        bold: true,
        size: 14,
        color: { argb: COLORS.text },
      };
      wsS.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.titleBg },
      };
      wsS.getCell("A1").alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      wsS.getRow(1).height = 26;

      wsS.mergeCells("A2:E2");
      wsS.getCell("A2").value = `Gerado em: ${new Date().toLocaleString(
        "pt-BR"
      )}`;
      wsS.getCell("A2").font = { size: 10, color: { argb: COLORS.muted } };

      wsS.mergeCells("A3:E3");
      wsS.getCell("A3").value = `Filtros: ${filtersText}`;
      wsS.getCell("A3").font = { size: 10, color: { argb: COLORS.muted } };

      wsS.addRow([]);

      const headerResumo = wsS.addRow([
        "Indicador",
        "Valor",
        "",
        "Indicador",
        "Valor",
      ]);

      headerResumo.eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 11,
          color: { argb: COLORS.headerText },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.headerBg },
        };
        cell.border = {
          top: { style: "thin", color: { argb: COLORS.border } },
          left: { style: "thin", color: { argb: COLORS.border } },
          bottom: { style: "thin", color: { argb: COLORS.border } },
          right: { style: "thin", color: { argb: COLORS.border } },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });

      const batAguasCount = filtered.filter((a) => a.batismoAguas).length;
      const batESCount = filtered.filter((a) => a.batismoES).length;
      const autorizaParticipacaoCount = filtered.filter(
        (a) => a.autorizaParticipacao
      ).length;
      const autorizaImagemCount = filtered.filter(
        (a) => a.autorizaImagem
      ).length;
      const autorizaWhatsAppCount = filtered.filter(
        (a) => a.autorizaWhatsApp
      ).length;

      const rowsResumo = [
        ["Total no sistema", totalAll, "", "Total filtrado", totalFiltered],
        ["Batizados nas águas", batAguasCount, "", "Batizados ES", batESCount],
        [
          "Autorizam participação",
          autorizaParticipacaoCount,
          "",
          "Autorizam imagem",
          autorizaImagemCount,
        ],
        [
          "Autorizam WhatsApp",
          autorizaWhatsAppCount,
          "",
          "Gerado em",
          new Date().toLocaleDateString("pt-BR"),
        ],
      ];

      rowsResumo.forEach((rowData, idx) => {
        const row = wsS.addRow(rowData);
        row.height = 18;

        row.eachCell((cell) => {
          cell.font = { size: 11, color: { argb: COLORS.text } };
          cell.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };
          cell.alignment = { vertical: "middle", horizontal: "left" };

          if (idx % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: COLORS.soft },
            };
          }
        });

        row.getCell(2).alignment = {
          vertical: "middle",
          horizontal: "right",
        };
        row.getCell(5).alignment = {
          vertical: "middle",
          horizontal: "right",
        };
      });

      wsS.columns = [
        { width: 26 },
        { width: 16 },
        { width: 4 },
        { width: 26 },
        { width: 18 },
      ];

      const ws = wb.addWorksheet("Adolescentes", {
        views: [{ state: "frozen", ySplit: 5 }],
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      ws.mergeCells("A1:R1");
      ws.getCell("A1").value = "Geração Teen | Relatório de Adolescentes";
      ws.getCell("A1").font = {
        bold: true,
        size: 14,
        color: { argb: COLORS.text },
      };
      ws.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.titleBg },
      };
      ws.getCell("A1").alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      ws.getRow(1).height = 26;

      ws.mergeCells("A2:R2");
      ws.getCell("A2").value = `Gerado em: ${new Date().toLocaleString(
        "pt-BR"
      )}`;
      ws.getCell("A2").font = { size: 10, color: { argb: COLORS.muted } };

      ws.mergeCells("A3:R3");
      ws.getCell("A3").value = `Filtros: ${filtersText}`;
      ws.getCell("A3").font = { size: 10, color: { argb: COLORS.muted } };

      ws.mergeCells("A4:R4");
      ws.getCell("A4").value = `Total de registros exportados: ${filtered.length}`;
      ws.getCell("A4").font = {
        bold: true,
        size: 10,
        color: { argb: COLORS.text },
      };

      ws.addRow([]);

      const headers = [
        "Nome",
        "Congregação",
        "Idade",
        "Telefone adolescente",
        "Nome da mãe",
        "Telefone da mãe",
        "Nome do pai",
        "Telefone do pai",
        "Responsável principal",
        "Parentesco",
        "Telefone responsável",
        "Batizado nas águas",
        "Batizado ES",
        "Autoriza participação",
        "Autoriza imagem",
        "Autoriza WhatsApp",
        "Observações",
        "Cadastrado em",
      ];

      const headerRow = ws.addRow(headers);

      headerRow.height = 20;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 11,
          color: { argb: COLORS.headerText },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.headerBg },
        };
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
        { width: 18 },
        { width: 28 },
        { width: 18 },
        { width: 28 },
        { width: 18 },
        { width: 28 },
        { width: 22 },
        { width: 18 },
        { width: 18 },
        { width: 14 },
        { width: 22 },
        { width: 18 },
        { width: 20 },
        { width: 40 },
        { width: 16 },
      ];

      ws.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: headerRow.number, column: headers.length },
      };

      filtered.forEach((adolescente, idx) => {
        const row = ws.addRow([
          adolescente.nome,
          getCongregacaoNome(adolescente.congregacaoId),
          calcAge(adolescente.nascimento),
          formatPhone(adolescente.telefone),
          adolescente.nomeMae || "-",
          formatPhone(adolescente.telefoneMae),
          adolescente.nomePai || "-",
          formatPhone(adolescente.telefonePai),
          adolescente.responsavelNome || "-",
          adolescente.responsavelParentesco || "-",
          formatPhone(adolescente.responsavelTelefone),
          booleanLabel(adolescente.batismoAguas),
          booleanLabel(adolescente.batismoES),
          booleanLabel(adolescente.autorizaParticipacao),
          booleanLabel(adolescente.autorizaImagem),
          booleanLabel(adolescente.autorizaWhatsApp),
          adolescente.observacoesResponsavel || "-",
          formatDateBR(adolescente.createdAt),
        ]);

        row.height = 20;

        row.eachCell((cell) => {
          cell.font = { size: 11, color: { argb: COLORS.text } };
          cell.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: false,
          };

          if (idx % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: COLORS.zebra },
            };
          }
        });

        row.getCell(3).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell(12).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell(13).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell(14).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell(15).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        row.getCell(16).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });

      ws.addRow([]);

      const footer = ws.addRow([
        "Relatório gerado automaticamente | Geração Teen",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      ws.mergeCells(`A${footer.number}:R${footer.number}`);
      ws.getCell(`A${footer.number}`).font = {
        size: 10,
        color: { argb: COLORS.muted },
      };

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
    <AdminLayout title="Adolescentes">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Adolescentes
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
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, congregação ou responsável..."
              className="input-field pl-10"
            />
          </div>

          <Button onClick={handleExport} disabled={loading || !filtered.length}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </Button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Filtros</span>

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

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            isLimited ? "lg:grid-cols-3" : "lg:grid-cols-4"
          } gap-3 mb-6`}
        >
          {!isLimited && (
            <SelectField
              value={
                congOptions.find((o) => o.value === filtCong) || congOptions[0]
              }
              onChange={(opt) => setFiltCong(opt?.value || "")}
              options={congOptions}
              placeholder="Todas Congregações"
            />
          )}

          <SelectField
            value={
              simNaoOptions("Batismo nas Águas").find(
                (o) => o.value === filtBatAguas
              ) || simNaoOptions("Batismo nas Águas")[0]
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
            value={
              simNaoOptions("Autoriza participação").find(
                (o) => o.value === filtAutorizaParticipacao
              ) || simNaoOptions("Autoriza participação")[0]
            }
            onChange={(opt) =>
              setFiltAutorizaParticipacao(opt?.value || "")
            }
            options={simNaoOptions("Autoriza participação")}
            placeholder="Autoriza participação"
          />

          <SelectField
            value={
              simNaoOptions("Autoriza imagem").find(
                (o) => o.value === filtAutorizaImagem
              ) || simNaoOptions("Autoriza imagem")[0]
            }
            onChange={(opt) => setFiltAutorizaImagem(opt?.value || "")}
            options={simNaoOptions("Autoriza imagem")}
            placeholder="Autoriza imagem"
          />

          <SelectField
            value={
              simNaoOptions("Autoriza WhatsApp").find(
                (o) => o.value === filtAutorizaWhatsApp
              ) || simNaoOptions("Autoriza WhatsApp")[0]
            }
            onChange={(opt) => setFiltAutorizaWhatsApp(opt?.value || "")}
            options={simNaoOptions("Autoriza WhatsApp")}
            placeholder="Autoriza WhatsApp"
          />
        </div>

        <Table columns={columns} data={filtered} />
      </Card>

      <Modal
        open={!!selectedAdolescente}
        onClose={() => setSelectedAdolescente(null)}
        title="Detalhes do Adolescente"
      >
        {selectedAdolescente && (
          <div className="space-y-5 text-sm text-foreground">
            <DetailSection title="Dados do Adolescente">
              <DetailItem label="Nome" value={selectedAdolescente.nome} />
              <DetailItem
                label="Congregação"
                value={getCongregacaoNome(selectedAdolescente.congregacaoId)}
              />
              <DetailItem
                label="Nascimento"
                value={formatDateBR(selectedAdolescente.nascimento)}
              />
              <DetailItem
                label="Idade"
                value={`${calcAge(selectedAdolescente.nascimento)} anos`}
              />
              <DetailItem label="Sexo" value={selectedAdolescente.sexo} />
              <DetailItem
                label="CPF do adolescente"
                value={safeMaskedCpf(selectedAdolescente.cpfMascarado)}
              />
              <DetailItem
                label="Telefone do adolescente"
                value={formatPhone(selectedAdolescente.telefone)}
              />
            </DetailSection>

            <DetailSection title="Responsável e Filiação">
              <DetailItem
                label="Nome da mãe"
                value={selectedAdolescente.nomeMae || "-"}
              />
              <DetailItem
                label="Telefone da mãe"
                value={formatPhone(selectedAdolescente.telefoneMae) || "-"}
              />
              <DetailItem
                label="Nome do pai"
                value={selectedAdolescente.nomePai || "-"}
              />
              <DetailItem
                label="Telefone do pai"
                value={formatPhone(selectedAdolescente.telefonePai) || "-"}
              />
              <DetailItem
                label="Responsável principal"
                value={selectedAdolescente.responsavelNome}
              />
              <DetailItem
                label="CPF do responsável"
                value={safeMaskedCpf(selectedAdolescente.responsavelCpfMascarado)}
              />
              <DetailItem
                label="Parentesco ou vínculo"
                value={selectedAdolescente.responsavelParentesco}
              />
              <DetailItem
                label="Telefone do responsável"
                value={formatPhone(selectedAdolescente.responsavelTelefone)}
              />
            </DetailSection>

            <DetailSection title="Endereço">
              <DetailItem label="CEP" value={selectedAdolescente.cep || "-"} />
              <DetailItem
                label="Logradouro"
                value={selectedAdolescente.logradouro || "-"}
              />
              <DetailItem
                label="Número"
                value={selectedAdolescente.numero || "-"}
              />
              <DetailItem
                label="Complemento"
                value={selectedAdolescente.complemento || "-"}
              />
              <DetailItem
                label="Bairro"
                value={selectedAdolescente.bairro || "-"}
              />
              <DetailItem
                label="Cidade"
                value={selectedAdolescente.cidade || "-"}
              />
              <DetailItem label="UF" value={selectedAdolescente.uf || "-"} />
            </DetailSection>

            <DetailSection title="Situação Espiritual">
              <DetailItem
                label="Batizado nas águas"
                value={booleanLabel(selectedAdolescente.batismoAguas)}
              />
              <DetailItem
                label="Batizado com Espírito Santo"
                value={booleanLabel(selectedAdolescente.batismoES)}
              />
            </DetailSection>

            <DetailSection title="Autorizações do Responsável">
              <DetailItem
                label="Autoriza participação"
                value={booleanLabel(selectedAdolescente.autorizaParticipacao)}
              />
              <DetailItem
                label="Autoriza uso de imagem"
                value={booleanLabel(selectedAdolescente.autorizaImagem)}
              />
              <DetailItem
                label="Autoriza contato por WhatsApp"
                value={booleanLabel(selectedAdolescente.autorizaWhatsApp)}
              />
              <DetailItem
                label="Aceite LGPD do responsável"
                value={booleanLabel(selectedAdolescente.lgpdResponsavel)}
              />
              <DetailItem
                label="Observações"
                value={selectedAdolescente.observacoesResponsavel || "-"}
                full
              />
              <DetailItem
                label="Cadastrado em"
                value={formatDateBR(selectedAdolescente.createdAt)}
              />
            </DetailSection>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editingAdolescente}
        onClose={() => setEditingAdolescente(null)}
        title="Editar Adolescente"
      >
        {editingAdolescente && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <EditSection title="Dados do Adolescente">
              <Input
                label="Nome"
                value={editingAdolescente.nome || ""}
                onChange={(v) =>
                  setEditingAdolescente((p) => ({ ...p, nome: v }))
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Nascimento"
                  type="date"
                  value={editingAdolescente.nascimento || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, nascimento: v }))
                  }
                />

                <SelectField
                  label="Sexo"
                  value={
                    sexoOptions.find(
                      (o) => o.value === editingAdolescente.sexo
                    ) || null
                  }
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      sexo: opt?.value || "",
                    }))
                  }
                  options={sexoOptions}
                  placeholder="Selecione..."
                />

                <Input
                  label="Telefone"
                  value={editingAdolescente.telefone || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, telefone: v }))
                  }
                />
              </div>
            </EditSection>

            <EditSection title="Responsável e Filiação">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nome da mãe"
                  value={editingAdolescente.nomeMae || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, nomeMae: v }))
                  }
                />

                <Input
                  label="Telefone da mãe"
                  value={editingAdolescente.telefoneMae || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, telefoneMae: v }))
                  }
                />

                <Input
                  label="Nome do pai"
                  value={editingAdolescente.nomePai || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, nomePai: v }))
                  }
                />

                <Input
                  label="Telefone do pai"
                  value={editingAdolescente.telefonePai || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, telefonePai: v }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Responsável principal"
                  value={editingAdolescente.responsavelNome || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      responsavelNome: v,
                    }))
                  }
                />

                <SelectField
                  label="Parentesco ou vínculo"
                  value={
                    parentescoOptions.find(
                      (o) => o.value === editingAdolescente.responsavelParentesco
                    ) || null
                  }
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      responsavelParentesco: opt?.value || "",
                    }))
                  }
                  options={parentescoOptions}
                  placeholder="Selecione..."
                />

                <Input
                  label="Telefone do responsável"
                  value={editingAdolescente.responsavelTelefone || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      responsavelTelefone: v,
                    }))
                  }
                />
              </div>
            </EditSection>

            <EditSection title="Endereço">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="CEP"
                  value={editingAdolescente.cep || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, cep: v }))
                  }
                />

                <Input
                  label="Cidade"
                  value={editingAdolescente.cidade || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, cidade: v }))
                  }
                />

                <Input
                  label="UF"
                  value={editingAdolescente.uf || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, uf: v }))
                  }
                />
              </div>

              <Input
                label="Logradouro"
                value={editingAdolescente.logradouro || ""}
                onChange={(v) =>
                  setEditingAdolescente((p) => ({ ...p, logradouro: v }))
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Número"
                  value={editingAdolescente.numero || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, numero: v }))
                  }
                />

                <Input
                  label="Complemento"
                  value={editingAdolescente.complemento || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      complemento: v,
                    }))
                  }
                />

                <Input
                  label="Bairro"
                  value={editingAdolescente.bairro || ""}
                  onChange={(v) =>
                    setEditingAdolescente((p) => ({ ...p, bairro: v }))
                  }
                />
              </div>
            </EditSection>

            <EditSection title="Situação Espiritual">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField
                  label="Batizado nas águas"
                  value={booleanToSelect(editingAdolescente.batismoAguas)}
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      batismoAguas: selectToBoolean(opt?.value),
                    }))
                  }
                  options={simNaoOptions("Batismo nas Águas").slice(1)}
                />

                <SelectField
                  label="Batizado com Espírito Santo"
                  value={booleanToSelect(editingAdolescente.batismoES)}
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      batismoES: selectToBoolean(opt?.value),
                    }))
                  }
                  options={simNaoOptions("Batismo ES").slice(1)}
                />
              </div>
            </EditSection>

            <EditSection title="Autorizações do Responsável">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SelectField
                  label="Autoriza participação"
                  value={booleanToSelect(
                    editingAdolescente.autorizaParticipacao
                  )}
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      autorizaParticipacao: selectToBoolean(opt?.value),
                    }))
                  }
                  options={simNaoOptions("Autoriza participação").slice(1)}
                />

                <SelectField
                  label="Autoriza uso de imagem"
                  value={booleanToSelect(editingAdolescente.autorizaImagem)}
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      autorizaImagem: selectToBoolean(opt?.value),
                    }))
                  }
                  options={simNaoOptions("Autoriza imagem").slice(1)}
                />

                <SelectField
                  label="Autoriza WhatsApp"
                  value={booleanToSelect(editingAdolescente.autorizaWhatsApp)}
                  onChange={(opt) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      autorizaWhatsApp: selectToBoolean(opt?.value),
                    }))
                  }
                  options={simNaoOptions("Autoriza WhatsApp").slice(1)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Observações do responsável
                </label>
                <textarea
                  value={editingAdolescente.observacoesResponsavel || ""}
                  onChange={(e) =>
                    setEditingAdolescente((p) => ({
                      ...p,
                      observacoesResponsavel: e.target.value,
                    }))
                  }
                  maxLength={500}
                  className="input-field min-h-[90px] resize-y"
                />
              </div>

              <SelectField
                label="Aceite LGPD do responsável"
                value={booleanToSelect(editingAdolescente.lgpdResponsavel)}
                onChange={(opt) =>
                  setEditingAdolescente((p) => ({
                    ...p,
                    lgpdResponsavel: selectToBoolean(opt?.value),
                  }))
                }
                options={simNaoOptions("LGPD").slice(1)}
              />
            </EditSection>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingAdolescente(null)}
                disabled={savingEdit}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-heading font-semibold text-foreground mb-3">
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value || "-"}
      </div>
    </div>
  );
}

function EditSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-heading font-semibold text-foreground">
        {title}
      </h3>

      {children}
    </div>
  );
}