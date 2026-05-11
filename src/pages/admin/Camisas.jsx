import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import SelectField from "../../components/SelectField";
import Modal from "../../components/Modal";
import {
  listCamisaReservas,
  getCamisaResumo,
  updatePagamentoReserva,
  anexarComprovanteReserva,
  removerComprovanteReserva,
  getCampanhaAtiva,
  salvarCampanhaAtiva,
} from "../../lib/camisaApi";
import {
  Shirt,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  RefreshCcw,
  MessageCircle,
  Copy,
  XCircle,
  Upload,
  Settings,
  Users,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "comprovante enviado", label: "Comprovante enviado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
];

const formaPagamentoOptions = [
  { value: "", label: "Todas formas" },
  { value: "Pix", label: "Pix" },
  { value: "Pix parcelado", label: "Pix parcelado" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Cartão", label: "Cartão" },
];

function formatMoney(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatCPF(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 11) return value || "";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
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

function statusBadgeClass(status) {
  if (status === "confirmado") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "comprovante enviado") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "cancelado") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

function whatsappUrl(telefone, mensagem) {
  const phone = String(telefone || "").replace(/\D/g, "");
  return `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`;
}

function mensagemReserva(reserva) {
  if (reserva.statusPagamento === "confirmado") {
    return `Paz do Senhor, ${reserva.nome}. Seu pagamento da camisa da UMADRUR foi confirmado. Deus abençoe.`;
  }

  return `Paz do Senhor, ${reserva.nome}. Identificamos sua reserva da camisa da UMADRUR. Consta como pagamento pendente. Assim que realizar o pagamento, envie o comprovante para confirmação.`;
}

export default function Camisas() {
  const [reservas, setReservas] = useState([]);
  const [campanha, setCampanha] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filtCongregacao, setFiltCongregacao] = useState("");
  const [filtTamanho, setFiltTamanho] = useState("");
  const [filtStatus, setFiltStatus] = useState("");
  const [filtForma, setFiltForma] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [selectedReserva, setSelectedReserva] = useState(null);
  const [comprovanteReserva, setComprovanteReserva] = useState(null);
  const [campanhaModal, setCampanhaModal] = useState(false);
  const [acoesMobileReserva, setAcoesMobileReserva] = useState(null);
  const [comprovanteArquivo, setComprovanteArquivo] = useState(null);

  const [campanhaForm, setCampanhaForm] = useState({
    nomeCampanha: "",
    tema: "",
    valorCamisa: "",
    chavePix: "",
    recebedor: "",
    status: "ativa",
  });

  async function loadData() {
    try {
      setLoading(true);

      const [reservasData] = await Promise.all([
        listCamisaReservas(),
        getCamisaResumo(),
      ]);

      setReservas(Array.isArray(reservasData?.reservas) ? reservasData.reservas : []);

      try {
        const campanhaData = await getCampanhaAtiva();
        setCampanha(campanhaData?.campanha || null);
      } catch {
        setCampanha(null);
      }
    } catch (err) {
      toast.error(err?.message || "Erro ao carregar módulo de camisas");
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const congregacoesOptions = useMemo(() => {
    const values = [...new Set(reservas.map((r) => r.congregacao).filter(Boolean))];

    return [
      { value: "", label: "Todas congregações" },
      ...values.sort().map((c) => ({ value: c, label: c })),
    ];
  }, [reservas]);

  const tamanhoOptions = useMemo(() => {
    const values = [...new Set(reservas.map((r) => r.tamanho).filter(Boolean))];

    return [
      { value: "", label: "Todos tamanhos" },
      ...values.sort().map((t) => ({ value: t, label: t })),
    ];
  }, [reservas]);

  const filtered = useMemo(() => {
    return reservas.filter((r) => {
      const term = search.trim().toLowerCase();

      if (term) {
        const alvo = [
          r.nome,
          r.cpf,
          r.telefone,
          r.congregacao,
          r.tamanho,
          r.formaPagamento,
          r.statusPagamento,
        ]
          .join(" ")
          .toLowerCase();

        if (!alvo.includes(term)) return false;
      }

      if (filtCongregacao && r.congregacao !== filtCongregacao) return false;
      if (filtTamanho && r.tamanho !== filtTamanho) return false;
      if (filtStatus && r.statusPagamento !== filtStatus) return false;
      if (filtForma && r.formaPagamento !== filtForma) return false;

      if (dataInicio) {
        const created = new Date(r.criadoEm);
        const start = new Date(dataInicio);
        if (created < start) return false;
      }

      if (dataFim) {
        const created = new Date(r.criadoEm);
        const end = new Date(dataFim);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }

      return true;
    });
  }, [
    reservas,
    search,
    filtCongregacao,
    filtTamanho,
    filtStatus,
    filtForma,
    dataInicio,
    dataFim,
  ]);

  const resumoFiltrado = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        const quantidade = Number(r.quantidade || 0);
        const valor = Number(r.valorTotal || 0);
        const comprovantes = (r.comprovantes || []).length;

        acc.totalReservas += 1;
        acc.totalCamisas += quantidade;
        acc.valorTotal += valor;
        acc.comprovantes += comprovantes;

        if (r.statusPagamento === "confirmado") {
          acc.valorConfirmado += valor;
          acc.confirmados += 1;
        }

        if (r.statusPagamento === "pendente" || r.statusPagamento === "comprovante enviado") {
          acc.valorPendente += valor;
          acc.pendentes += 1;
        }

        if (r.statusPagamento === "comprovante enviado") {
          acc.comprovantesEnviados += 1;
        }

        return acc;
      },
      {
        totalReservas: 0,
        totalCamisas: 0,
        valorTotal: 0,
        valorConfirmado: 0,
        valorPendente: 0,
        pendentes: 0,
        confirmados: 0,
        comprovantes: 0,
        comprovantesEnviados: 0,
      }
    );
  }, [filtered]);

  const porTamanho = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const tamanho = r.tamanho || "Não informado";
      map[tamanho] = (map[tamanho] || 0) + Number(r.quantidade || 0);
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const porCongregacao = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const key = r.congregacao || "Não informada";

      if (!map[key]) {
        map[key] = {
          reservas: 0,
          camisas: 0,
          valorTotal: 0,
          valorConfirmado: 0,
          valorPendente: 0,
        };
      }

      map[key].reservas += 1;
      map[key].camisas += Number(r.quantidade || 0);
      map[key].valorTotal += Number(r.valorTotal || 0);

      if (r.statusPagamento === "confirmado") {
        map[key].valorConfirmado += Number(r.valorTotal || 0);
      }

      if (r.statusPagamento === "pendente" || r.statusPagamento === "comprovante enviado") {
        map[key].valorPendente += Number(r.valorTotal || 0);
      }
    });

    return Object.entries(map)
      .map(([congregacao, data]) => ({ congregacao, ...data }))
      .sort((a, b) => b.camisas - a.camisas);
  }, [filtered]);

  async function alterarStatus(reserva, statusPagamento) {
    try {
      await updatePagamentoReserva(reserva.id, statusPagamento);
      toast.success("Status atualizado com sucesso");
      await loadData();
    } catch (err) {
      toast.error(err?.message || "Erro ao atualizar status");
    }
  }

  async function salvarComprovante(e) {
    e.preventDefault();

    if (!comprovanteReserva) return;

    if (!comprovanteArquivo) {
      toast.error("Selecione uma imagem ou PDF");
      return;
    }

    try {
      await anexarComprovanteReserva(comprovanteReserva.id, comprovanteArquivo);
      toast.success("Comprovante anexado com sucesso");

      setComprovanteReserva(null);
      setComprovanteArquivo(null);

      await loadData();
    } catch (err) {
      toast.error(err?.message || "Erro ao anexar comprovante");
    }
  }

  async function removerComprovante(reservaId, comprovanteId) {
    const confirmar = window.confirm("Deseja remover este comprovante?");
    if (!confirmar) return;

    try {
      await removerComprovanteReserva(reservaId, comprovanteId);
      toast.success("Comprovante removido com sucesso");

      setSelectedReserva(null);
      await loadData();
    } catch (err) {
      toast.error(err?.message || "Erro ao remover comprovante");
    }
  }

  async function salvarCampanha(e) {
    e.preventDefault();

    try {
      await salvarCampanhaAtiva({
        ...campanhaForm,
        valorCamisa: Number(campanhaForm.valorCamisa || 0),
      });

      toast.success("Campanha ativa salva com sucesso");
      setCampanhaModal(false);
      await loadData();
    } catch (err) {
      toast.error(err?.message || "Erro ao salvar campanha");
    }
  }

  function abrirCampanhaModal() {
    setCampanhaForm({
      nomeCampanha: campanha?.nomeCampanha || "",
      tema: campanha?.tema || "",
      valorCamisa: campanha?.valorCamisa || "",
      chavePix: campanha?.chavePix || "",
      recebedor: campanha?.recebedor || "",
      status: campanha?.status || "ativa",
    });

    setCampanhaModal(true);
  }

  function copiarMensagem(reserva) {
    navigator.clipboard.writeText(mensagemReserva(reserva));
    toast.success("Mensagem copiada");
  }

  function limparFiltros() {
    setSearch("");
    setFiltCongregacao("");
    setFiltTamanho("");
    setFiltStatus("");
    setFiltForma("");
    setDataInicio("");
    setDataFim("");
  }

  async function exportarExcel() {
    try {
      const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
        import("exceljs"),
        import("file-saver"),
      ]);

      const wb = new ExcelJS.Workbook();
      wb.creator = "UMADRUR";
      wb.created = new Date();

      const wsResumo = wb.addWorksheet("Resumo");
      const wsReservas = wb.addWorksheet("Reservas");
      const wsCongregacoes = wb.addWorksheet("Por Congregação");
      const wsTamanhos = wb.addWorksheet("Por Tamanho");

      const COLORS = {
        titleBg: "FFFFF3E8",
        headerBg: "FFFFEFE2",
        headerText: "FFC55300",
        border: "FFE5E7EB",
        soft: "FFFFFAF5",
        text: "FF111827",
      };

      function styleTitle(ws, title, range) {
        ws.mergeCells(range);
        const cell = ws.getCell(range.split(":")[0]);
        cell.value = title;
        cell.font = { bold: true, size: 15, color: { argb: COLORS.text } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.titleBg } };
        cell.alignment = { horizontal: "left", vertical: "middle" };
        ws.getRow(1).height = 28;
      }

      function styleHeader(row) {
        row.eachCell((cell) => {
          cell.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };
        });
      }

      function styleBodyRow(row, index) {
        row.eachCell((cell) => {
          cell.font = { size: 10, color: { argb: COLORS.text } };
          cell.alignment = { vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: COLORS.border } },
            left: { style: "thin", color: { argb: COLORS.border } },
            bottom: { style: "thin", color: { argb: COLORS.border } },
            right: { style: "thin", color: { argb: COLORS.border } },
          };

          if (index % 2 === 0) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.soft } };
          }
        });
      }

      styleTitle(wsResumo, "UMADRUR | Resumo das Reservas de Camisas", "A1:D1");
      wsResumo.addRow(["Gerado em", new Date().toLocaleString("pt-BR")]);
      wsResumo.addRow([]);
      styleHeader(wsResumo.addRow(["Indicador", "Valor", "Indicador", "Valor"]));

      [
        ["Total de reservas", resumoFiltrado.totalReservas, "Camisas reservadas", resumoFiltrado.totalCamisas],
        ["Valor reservado", resumoFiltrado.valorTotal, "Valor confirmado", resumoFiltrado.valorConfirmado],
        ["Valor pendente", resumoFiltrado.valorPendente, "Pagamentos pendentes", resumoFiltrado.pendentes],
        ["Pagamentos confirmados", resumoFiltrado.confirmados, "Comprovantes anexados", resumoFiltrado.comprovantes],
      ].forEach((r, idx) => {
        const row = wsResumo.addRow(r);
        styleBodyRow(row, idx);
      });

      wsResumo.columns = [
        { width: 26 },
        { width: 18 },
        { width: 26 },
        { width: 18 },
      ];
      wsResumo.getColumn(2).numFmt = '"R$" #,##0.00';
      wsResumo.getColumn(4).numFmt = '"R$" #,##0.00';

      styleTitle(wsReservas, "UMADRUR | Relatório de Reservas de Camisas", "A1:L1");
      wsReservas.addRow([`Gerado em: ${new Date().toLocaleString("pt-BR")}`]);
      wsReservas.addRow([
        `Filtros: busca=${search || "-"} | congregação=${filtCongregacao || "Todas"} | tamanho=${filtTamanho || "Todos"} | status=${filtStatus || "Todos"} | forma=${filtForma || "Todas"} | período=${dataInicio || "-"} até ${dataFim || "-"}`,
      ]);
      wsReservas.mergeCells("A2:L2");
      wsReservas.mergeCells("A3:L3");
      wsReservas.addRow([]);

      const headerReservas = wsReservas.addRow([
        "Nome",
        "CPF",
        "Telefone",
        "Congregação",
        "Tamanho",
        "Quantidade",
        "Forma de Pagamento",
        "Valor Unitário",
        "Valor Total",
        "Status",
        "Comprovantes",
        "Data da Reserva",
      ]);
      styleHeader(headerReservas);

      filtered.forEach((r, idx) => {
        const row = wsReservas.addRow([
          r.nome,
          formatCPF(r.cpf),
          formatPhone(r.telefone),
          r.congregacao,
          r.tamanho,
          r.quantidade,
          r.formaPagamento,
          Number(r.valorUnitario || 0),
          Number(r.valorTotal || 0),
          r.statusPagamento,
          `${(r.comprovantes || []).length}/3`,
          formatDate(r.criadoEm),
        ]);
        styleBodyRow(row, idx);
      });

      wsReservas.columns = [
        { width: 30 },
        { width: 18 },
        { width: 18 },
        { width: 34 },
        { width: 12 },
        { width: 12 },
        { width: 20 },
        { width: 16 },
        { width: 16 },
        { width: 22 },
        { width: 16 },
        { width: 18 },
      ];
      wsReservas.getColumn(8).numFmt = '"R$" #,##0.00';
      wsReservas.getColumn(9).numFmt = '"R$" #,##0.00';

      styleTitle(wsCongregacoes, "UMADRUR | Resumo por Congregação", "A1:F1");
      wsCongregacoes.addRow([]);
      styleHeader(
        wsCongregacoes.addRow([
          "Congregação",
          "Reservas",
          "Camisas",
          "Valor Total",
          "Valor Confirmado",
          "Valor Pendente",
        ])
      );

      porCongregacao.forEach((item, idx) => {
        const row = wsCongregacoes.addRow([
          item.congregacao,
          item.reservas,
          item.camisas,
          item.valorTotal,
          item.valorConfirmado,
          item.valorPendente,
        ]);
        styleBodyRow(row, idx);
      });

      wsCongregacoes.columns = [
        { width: 38 },
        { width: 12 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
      ];
      wsCongregacoes.getColumn(4).numFmt = '"R$" #,##0.00';
      wsCongregacoes.getColumn(5).numFmt = '"R$" #,##0.00';
      wsCongregacoes.getColumn(6).numFmt = '"R$" #,##0.00';

      styleTitle(wsTamanhos, "UMADRUR | Resumo por Tamanho", "A1:B1");
      wsTamanhos.addRow([]);
      styleHeader(wsTamanhos.addRow(["Tamanho", "Quantidade"]));

      porTamanho.forEach(([tamanho, quantidade], idx) => {
        const row = wsTamanhos.addRow([tamanho, quantidade]);
        styleBodyRow(row, idx);
      });

      wsTamanhos.columns = [
        { width: 18 },
        { width: 16 },
      ];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `UMADRUR_Reservas_Camisas_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      toast.error(err?.message || "Erro ao exportar Excel");
    }
  }

  return (
    <AdminLayout title="Camisas">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Camisas UMADRUR
          </h2>
          <p className="text-sm text-muted-foreground">
            Reservas, pagamentos, comprovantes e acompanhamento geral do campo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </Button>

          <Button variant="secondary" onClick={exportarExcel} disabled={loading || !filtered.length}>
            <FileSpreadsheet size={17} />
            Exportar Excel
          </Button>

          <Button onClick={abrirCampanhaModal}>
            <Settings size={17} />
            Campanha ativa
          </Button>
        </div>
      </div>

      {campanha && (
        <Card className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Campanha ativa</p>
              <h3 className="text-base font-heading font-semibold text-foreground">
                {campanha.nomeCampanha}
              </h3>
              {campanha.tema && (
                <p className="text-sm text-muted-foreground">{campanha.tema}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Valor da camisa:{" "}
              <span className="text-primary font-semibold">
                {formatMoney(campanha.valorCamisa)}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-4">
        <ResumoCard icon={Shirt} label="Reservas" value={loading ? "..." : resumoFiltrado.totalReservas} />
        <ResumoCard icon={Users} label="Camisas reservadas" value={loading ? "..." : resumoFiltrado.totalCamisas} />
        <ResumoCard icon={DollarSign} label="Valor reservado" value={loading ? "..." : formatMoney(resumoFiltrado.valorTotal)} />
        <ResumoCard icon={CheckCircle} label="Valor confirmado" value={loading ? "..." : formatMoney(resumoFiltrado.valorConfirmado)} />
        <ResumoCard icon={Clock} label="Valor pendente" value={loading ? "..." : formatMoney(resumoFiltrado.valorPendente)} />
        <ResumoCard icon={Clock} label="Pagamentos pendentes" value={loading ? "..." : resumoFiltrado.pendentes} />
        <ResumoCard icon={CheckCircle} label="Pagamentos confirmados" value={loading ? "..." : resumoFiltrado.confirmados} />
        <ResumoCard icon={FileText} label="Comprovantes anexados" value={loading ? "..." : resumoFiltrado.comprovantes} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="font-heading font-semibold text-foreground mb-3">
            Resumo por tamanho
          </h3>

          <div className="space-y-3">
            {porTamanho.length ? (
              porTamanho.map(([tamanho, quantidade]) => (
                <div key={tamanho}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{tamanho}</span>
                    <span className="font-semibold">{quantidade}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          (quantidade / Math.max(1, resumoFiltrado.totalCamisas)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-heading font-semibold text-foreground mb-3">
            Resumo por congregação
          </h3>

          <div className="max-h-[280px] overflow-y-auto space-y-3 pr-2">
            {porCongregacao.length ? (
              porCongregacao.map((item) => (
                <div key={item.congregacao} className="rounded-xl border border-border p-3">
                  <div className="font-medium text-sm text-foreground mb-1">
                    {item.congregacao}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
                    <span>Reservas: {item.reservas}</span>
                    <span>Camisas: {item.camisas}</span>
                    <span>Total: {formatMoney(item.valorTotal)}</span>
                    <span>Confirmado: {formatMoney(item.valorConfirmado)}</span>
                    <span>Pendente: {formatMoney(item.valorPendente)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma reserva encontrada</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3 mb-5">
          <Input label="Buscar" value={search} onChange={setSearch} placeholder="Nome, CPF ou telefone" />

          <SelectField
            label="Congregação"
            value={congregacoesOptions.find((o) => o.value === filtCongregacao) || congregacoesOptions[0]}
            options={congregacoesOptions}
            onChange={(opt) => setFiltCongregacao(opt?.value || "")}
          />

          <SelectField
            label="Tamanho"
            value={tamanhoOptions.find((o) => o.value === filtTamanho) || tamanhoOptions[0]}
            options={tamanhoOptions}
            onChange={(opt) => setFiltTamanho(opt?.value || "")}
          />

          <SelectField
            label="Status"
            value={statusOptions.find((o) => o.value === filtStatus) || statusOptions[0]}
            options={statusOptions}
            onChange={(opt) => setFiltStatus(opt?.value || "")}
          />

          <SelectField
            label="Pagamento"
            value={formaPagamentoOptions.find((o) => o.value === filtForma) || formaPagamentoOptions[0]}
            options={formaPagamentoOptions}
            onChange={(opt) => setFiltForma(opt?.value || "")}
          />

          <Input label="Data inicial" type="date" value={dataInicio} onChange={setDataInicio} />
          <Input label="Data final" type="date" value={dataFim} onChange={setDataFim} />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
          <p className="text-sm text-muted-foreground">
            Exibindo {filtered.length} de {reservas.length} reservas
          </p>

          <Button variant="secondary" onClick={limparFiltros}>
            <XCircle size={17} />
            Limpar filtros
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full table-auto">
            <thead className="bg-surface-2/60">
              <tr className="border-b border-border">
                {[
                  "Nome",
                  "CPF",
                  "Telefone",
                  "Congregação",
                  "Tamanho",
                  "Qtd.",
                  "Pagamento",
                  "Valor",
                  "Status",
                  "Comprov.",
                  "Data",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5 px-4 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const confirmado = r.statusPagamento === "confirmado";
                const cancelado = r.statusPagamento === "cancelado";
                const podeAnexar = !cancelado && (r.comprovantes || []).length < 3;

                return (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-surface-2">
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap font-medium">{r.nome}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{formatCPF(r.cpf)}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{formatPhone(r.telefone)}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{r.congregacao}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{r.tamanho}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{r.quantidade}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{r.formaPagamento}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap font-semibold">{formatMoney(r.valorTotal)}</td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(r.statusPagamento)}`}>
                        {r.statusPagamento}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">
                      {(r.comprovantes || []).length}/3
                    </td>
                    <td className="py-2.5 px-4 text-sm whitespace-nowrap">{formatDate(r.criadoEm)}</td>
                    <td className="py-2.5 px-4">
                      <div className="hidden md:flex items-center gap-1">
                        <IconButton title="Ver detalhes" onClick={() => setSelectedReserva(r)}>
                          <Eye size={16} />
                        </IconButton>

                        {!confirmado && !cancelado && (
                          <IconButton title="Confirmar pagamento" onClick={() => alterarStatus(r, "confirmado")}>
                            <CheckCircle size={16} />
                          </IconButton>
                        )}

                        {podeAnexar && (
                          <IconButton title="Anexar comprovante" onClick={() => setComprovanteReserva(r)}>
                            <Upload size={16} />
                          </IconButton>
                        )}

                        {r.statusPagamento !== "pendente" && !confirmado && !cancelado && (
                          <IconButton title="Marcar pendente" onClick={() => alterarStatus(r, "pendente")}>
                            <Clock size={16} />
                          </IconButton>
                        )}

                        {!confirmado && !cancelado && (
                          <IconButton title="Cancelar reserva" danger onClick={() => alterarStatus(r, "cancelado")}>
                            <XCircle size={16} />
                          </IconButton>
                        )}

                        <a
                          href={whatsappUrl(r.telefone, mensagemReserva(r))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </a>

                        <IconButton title="Copiar mensagem" onClick={() => copiarMensagem(r)}>
                          <Copy size={16} />
                        </IconButton>
                      </div>

                      <div className="md:hidden">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setAcoesMobileReserva(r)}
                        >
                          Ações
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filtered.length && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma reserva encontrada
            </p>
          )}
        </div>
      </Card>

      <Modal open={!!selectedReserva} onClose={() => setSelectedReserva(null)} title="Detalhes da reserva">
        {selectedReserva && (
          <div className="space-y-3 text-sm">
            <Detail label="Nome" value={selectedReserva.nome} />
            <Detail label="CPF" value={formatCPF(selectedReserva.cpf)} />
            <Detail label="Telefone" value={formatPhone(selectedReserva.telefone)} />
            <Detail label="Congregação" value={selectedReserva.congregacao} />
            <Detail label="Tamanho" value={selectedReserva.tamanho} />
            <Detail label="Quantidade" value={selectedReserva.quantidade} />
            <Detail label="Valor unitário" value={formatMoney(selectedReserva.valorUnitario)} />
            <Detail label="Valor total" value={formatMoney(selectedReserva.valorTotal)} />
            <Detail label="Forma de pagamento" value={selectedReserva.formaPagamento} />
            <Detail label="Status" value={selectedReserva.statusPagamento} />
            <Detail label="Data da reserva" value={formatDate(selectedReserva.criadoEm)} />

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-foreground">Comprovantes</p>

                {selectedReserva.statusPagamento !== "cancelado" &&
                  (selectedReserva.comprovantes || []).length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setComprovanteReserva(selectedReserva);
                        setSelectedReserva(null);
                      }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Anexar novo
                    </button>
                  )}
              </div>

              {(selectedReserva.comprovantes || []).length ? (
                <div className="space-y-2">
                  {selectedReserva.comprovantes.map((c, idx) => (
                    <div
                      key={c._id || idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2"
                    >
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 text-sm text-primary hover:underline truncate"
                      >
                        {c.nomeArquivo || `Comprovante ${idx + 1}`}
                      </a>

                      <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(c.enviadoEm)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removerComprovante(selectedReserva.id, c._id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum comprovante anexado.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!comprovanteReserva}
        onClose={() => {
          setComprovanteReserva(null);
          setComprovanteArquivo(null);
        }}
        title="Anexar comprovante"
      >
        <form onSubmit={salvarComprovante} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Comprovante
            </label>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={(e) => setComprovanteArquivo(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white hover:file:bg-primary/90"
            />

            <p className="text-xs text-muted-foreground mt-2">
              Formatos aceitos: JPG, PNG, WEBP ou PDF. Limite: 5MB.
            </p>

            {comprovanteArquivo && (
              <p className="text-xs text-foreground mt-2">
                Arquivo selecionado: <strong>{comprovanteArquivo.name}</strong>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setComprovanteReserva(null);
                setComprovanteArquivo(null);
              }}
            >
              Cancelar
            </Button>

            <Button type="submit">
              Salvar comprovante
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={campanhaModal} onClose={() => setCampanhaModal(false)} title="Campanha ativa">
        <form onSubmit={salvarCampanha} className="space-y-3">
          <Input label="Nome da campanha" value={campanhaForm.nomeCampanha} onChange={(v) => setCampanhaForm((p) => ({ ...p, nomeCampanha: v }))} />
          <Input label="Tema" value={campanhaForm.tema} onChange={(v) => setCampanhaForm((p) => ({ ...p, tema: v }))} />
          <Input label="Valor da camisa" type="number" step="0.01" value={campanhaForm.valorCamisa} onChange={(v) => setCampanhaForm((p) => ({ ...p, valorCamisa: v }))} />
          <Input label="Chave Pix" value={campanhaForm.chavePix} onChange={(v) => setCampanhaForm((p) => ({ ...p, chavePix: v }))} />
          <Input label="Recebedor" value={campanhaForm.recebedor} onChange={(v) => setCampanhaForm((p) => ({ ...p, recebedor: v }))} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCampanhaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar campanha
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!acoesMobileReserva}
        onClose={() => setAcoesMobileReserva(null)}
        title="Ações da reserva"
      >
        {acoesMobileReserva && (
          <div className="space-y-2">
            <MobileAction
              label="Ver detalhes"
              onClick={() => {
                setSelectedReserva(acoesMobileReserva);
                setAcoesMobileReserva(null);
              }}
            />

            {acoesMobileReserva.statusPagamento !== "confirmado" &&
              acoesMobileReserva.statusPagamento !== "cancelado" && (
                <MobileAction
                  label="Confirmar pagamento"
                  onClick={() => {
                    alterarStatus(acoesMobileReserva, "confirmado");
                    setAcoesMobileReserva(null);
                  }}
                />
              )}

            {(acoesMobileReserva.comprovantes || []).length < 3 &&
              acoesMobileReserva.statusPagamento !== "cancelado" && (
                <MobileAction
                  label="Anexar comprovante"
                  onClick={() => {
                    setComprovanteReserva(acoesMobileReserva);
                    setAcoesMobileReserva(null);
                  }}
                />
              )}

            {acoesMobileReserva.statusPagamento !== "pendente" &&
              acoesMobileReserva.statusPagamento !== "confirmado" &&
              acoesMobileReserva.statusPagamento !== "cancelado" && (
                <MobileAction
                  label="Marcar como pendente"
                  onClick={() => {
                    alterarStatus(acoesMobileReserva, "pendente");
                    setAcoesMobileReserva(null);
                  }}
                />
              )}

            {acoesMobileReserva.statusPagamento !== "confirmado" &&
              acoesMobileReserva.statusPagamento !== "cancelado" && (
                <MobileAction
                  label="Cancelar reserva"
                  danger
                  onClick={() => {
                    alterarStatus(acoesMobileReserva, "cancelado");
                    setAcoesMobileReserva(null);
                  }}
                />
              )}

            <a
              href={whatsappUrl(acoesMobileReserva.telefone, mensagemReserva(acoesMobileReserva))}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl border border-border px-4 py-3 text-sm text-center hover:bg-surface-2"
            >
              Abrir WhatsApp
            </a>

            <MobileAction
              label="Copiar mensagem"
              onClick={() => {
                copiarMensagem(acoesMobileReserva);
                setAcoesMobileReserva(null);
              }}
            />
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

function ResumoCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-heading font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function IconButton({ children, title, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-foreground hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "-"}</span>
    </div>
  );
}

function MobileAction({ label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl border px-4 py-3 text-sm text-left transition-colors ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-border text-foreground hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}