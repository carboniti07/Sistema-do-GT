import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import SelectField from '../../components/SelectField';
import { mockJovens } from '../../lib/mockData';
import { congregacoes } from '../../lib/congregacoes';
import { Search, FileSpreadsheet, CalendarDays, Users, X } from 'lucide-react';

function calcAge(nascimento) {
  const today = new Date();
  const birth = new Date(nascimento);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const congOptions = [
  { value: '', label: 'Todas  Congregações ' },
  ...congregacoes.map((c) => ({ value: c, label: c })),
];

const simNaoOptions = (placeholder) => [
  { value: '', label: placeholder },
  { value: 'Sim', label: 'Sim' },
  { value: 'Nao', label: 'Nao' },
];

const cargoOptions = [
  { value: '', label: 'Cargo' },
  { value: 'Sim', label: 'Com cargo' },
  { value: 'Nao', label: 'Sem cargo' },
];

function formatTodayPtBR() {
  try {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date().toLocaleDateString('pt-BR');
  }
}

function buildFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `UMADRUR_Jovens_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
}

export default function Jovens() {
  const [search, setSearch] = useState('');
  const [filtCong, setFiltCong] = useState('');
  const [filtBatAguas, setFiltBatAguas] = useState('');
  const [filtBatES, setFiltBatES] = useState('');
  const [filtCargo, setFiltCargo] = useState('');

  const filtered = useMemo(() => {
    return mockJovens.filter((j) => {
      if (search && !j.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (filtCong && j.congregacao !== filtCong) return false;
      if (filtBatAguas === 'Sim' && !j.batismoAguas) return false;
      if (filtBatAguas === 'Nao' && j.batismoAguas) return false;
      if (filtBatES === 'Sim' && !j.batismoES) return false;
      if (filtBatES === 'Nao' && j.batismoES) return false;
      if (filtCargo === 'Sim' && !j.cargo) return false;
      if (filtCargo === 'Nao' && j.cargo) return false;
      return true;
    });
  }, [search, filtCong, filtBatAguas, filtBatES, filtCargo]);

  const totalAll = mockJovens.length;
  const totalFiltered = filtered.length;

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'congregacao', label: 'congregação ' },
    { key: 'nascimento', label: 'Idade', render: (v) => calcAge(v) + ' anos' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'batismoAguas', label: 'Bat. Aguas', render: (v) => (v ? 'Sim' : 'Nao') },
    { key: 'batismoES', label: 'Bat. ES', render: (v) => (v ? 'Sim' : 'Nao') },
    // ✅ Cargo simples (sem badge)
    { key: 'cargo', label: 'Cargo', render: (v) => v || '-' },
  ];

  const clearFilters = () => {
    setSearch('');
    setFiltCong('');
    setFiltBatAguas('');
    setFiltBatES('');
    setFiltCargo('');
  };

  const hasAnyFilter = !!(search || filtCong || filtBatAguas || filtBatES || filtCargo);

  // ✅ Excel premium (Resumo + Jovens)
  const handleExport = async () => {
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
      import('exceljs'),
      import('file-saver'),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'UMADRUR Connect';
    wb.created = new Date();

    const COLORS = {
      titleBg: 'FFF3E8',
      headerBg: 'FFF0E6',
      headerText: 'FF7A1A',
      border: 'FFE3D1',
      zebra: 'FFFAF6',
      text: 'FF111827',
      muted: 'FF6B7280',
      soft: 'FFF8F2',
    };

    const filtersText = `Congregação=${filtCong || 'Todas'} | Batismo Águas=${filtBatAguas || 'Todos'} | Batismo ES=${filtBatES || 'Todos'} | Cargo=${filtCargo || 'Todos'} | Busca=${search || '-'}`;

    // ====== Resumo
    const wsS = wb.addWorksheet('Resumo', {
      views: [{ state: 'frozen', ySplit: 3 }],
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    wsS.mergeCells('A1:E1');
    wsS.getCell('A1').value = 'UMADRUR Connect — Exportação de Jovens';
    wsS.getCell('A1').font = { bold: true, size: 14, color: { argb: COLORS.text } };
    wsS.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.titleBg } };
    wsS.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
    wsS.getRow(1).height = 26;

    wsS.mergeCells('A2:E2');
    wsS.getCell('A2').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    wsS.getCell('A2').font = { size: 10, color: { argb: COLORS.muted } };

    wsS.mergeCells('A3:E3');
    wsS.getCell('A3').value = `Filtros: ${filtersText}`;
    wsS.getCell('A3').font = { size: 10, color: { argb: COLORS.muted } };

    wsS.addRow([]);
    const headerResumo = wsS.addRow(['Indicador', 'Valor', '', 'Indicador', 'Valor']);
    headerResumo.eachCell((c) => {
      c.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
      c.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } },
      };
      c.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    const batAguasCount = filtered.filter((j) => j.batismoAguas).length;
    const batESCount = filtered.filter((j) => j.batismoES).length;
    const comCargoCount = filtered.filter((j) => j.cargo).length;

    const rowsResumo = [
      ['Total no sistema', totalAll, '', 'Total filtrado', totalFiltered],
      ['Batizados nas águas', batAguasCount, '', 'Batizados ES', batESCount],
      ['Com cargo', comCargoCount, '', 'Gerado em', new Date().toLocaleDateString('pt-BR')],
    ];

    rowsResumo.forEach((r, idx) => {
      const row = wsS.addRow(r);
      row.height = 18;
      row.eachCell((c) => {
        c.font = { size: 11, color: { argb: COLORS.text } };
        c.border = {
          top: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } },
        };
        c.alignment = { vertical: 'middle', horizontal: 'left' };
        if (idx % 2 === 0) {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.soft } };
        }
      });
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };
    });

    wsS.columns = [
      { width: 24 },
      { width: 14 },
      { width: 4 },
      { width: 24 },
      { width: 18 },
    ];

    // ====== Jovens
    const ws = wb.addWorksheet('Jovens', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = 'UMADRUR Connect — Relatório de Jovens';
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: COLORS.text } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.titleBg } };
    ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(1).height = 26;

    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    ws.getCell('A2').font = { size: 10, color: { argb: COLORS.muted } };

    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = `Filtros: ${filtersText}`;
    ws.getCell('A3').font = { size: 10, color: { argb: COLORS.muted } };

    ws.mergeCells('A4:G4');
    ws.getCell('A4').value = `Total de registros exportados: ${filtered.length}`;
    ws.getCell('A4').font = { bold: true, size: 10, color: { argb: COLORS.text } };

    ws.addRow([]);

    const headers = ['Nome', 'Congregacao', 'Idade', 'Telefone', 'Batizado nas Aguas', 'Batizado ES', 'Cargo'];
    const headerRow = ws.addRow(headers);

    headerRow.height = 18;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: COLORS.headerText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
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
        j.congregacao,
        calcAge(j.nascimento),
        j.telefone,
        j.batismoAguas ? 'Sim' : 'Nao',
        j.batismoES ? 'Sim' : 'Nao',
        j.cargo || '-',
      ]);

      row.height = 18;
      row.eachCell((cell) => {
        cell.font = { size: 11, color: { argb: COLORS.text } };
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } };
        }
      });

      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    ws.addRow([]);
    const footer = ws.addRow(['Relatório gerado automaticamente — UMADRUR Connect', '', '', '', '', '', '']);
    ws.mergeCells(`A${footer.number}:G${footer.number}`);
    ws.getCell(`A${footer.number}`).font = { size: 10, color: { argb: COLORS.muted } };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, buildFileName());
  };

  return (
    <AdminLayout title="Jovens">
      {/* Header no mesmo padrão do Dashboard (sem “Jovens” duplicado grande) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Jovens
          </h2>
          <p className="text-sm text-muted-foreground">
            Lista e filtros
          </p>
        </div>

        {/* ✅ mesmo estilo do Dashboard */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <CalendarDays size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{formatTodayPtBR()}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrados</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {totalFiltered}/{totalAll}
            </span>
          </div>
        </div>
      </div>

      <Card>
        {/* Busca + Exportar (sem botão Novo) */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="input-field pl-10"
            />
          </div>

          <Button onClick={handleExport}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </Button>
        </div>

        {/* Filtros + Limpar bonito (somente quando tiver filtro) */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SelectField
            value={congOptions.find((o) => o.value === filtCong) || congOptions[0]}
            onChange={(opt) => setFiltCong(opt?.value || '')}
            options={congOptions}
            placeholder="Todas Congregacoes"
          />

          <SelectField
            value={
              simNaoOptions('Batismo nas Aguas').find((o) => o.value === filtBatAguas) ||
              simNaoOptions('Batismo nas Aguas')[0]
            }
            onChange={(opt) => setFiltBatAguas(opt?.value || '')}
            options={simNaoOptions('Batismo nas Aguas')}
            placeholder="Batismo nas Aguas"
          />

          <SelectField
            value={
              simNaoOptions('Batismo ES').find((o) => o.value === filtBatES) ||
              simNaoOptions('Batismo ES')[0]
            }
            onChange={(opt) => setFiltBatES(opt?.value || '')}
            options={simNaoOptions('Batismo ES')}
            placeholder="Batismo ES"
          />

          <SelectField
            value={cargoOptions.find((o) => o.value === filtCargo) || cargoOptions[0]}
            onChange={(opt) => setFiltCargo(opt?.value || '')}
            options={cargoOptions}
            placeholder="Cargo"
          />
        </div>

        {/* Tabela (mantém seu Table atual) */}
        <Table columns={columns} data={filtered} />
      </Card>
    </AdminLayout>
  );
}
