import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Table from '../../components/Table';
import SelectField from '../../components/SelectField';
import { mockUsuarios } from '../../lib/mockData';
import { congregacoes } from '../../lib/congregacoes';
import { toast } from 'sonner';
import { Search, CalendarDays, Users, X } from 'lucide-react';

const roleLabels = {
  admin_sistema: 'Administrador',
  lider_geral: 'Líder Geral',
  lider_congregacao: 'Líder de Congregação',
};

const statusLabels = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
};

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

const roleOptions = [
  { value: '', label: 'Todos perfis' },
  { value: 'admin_sistema', label: 'Administrador' },
  { value: 'lider_geral', label: 'Líder Geral' },
  { value: 'lider_congregacao', label: 'Líder de Congregação' },
];

const statusOptions = [
  { value: '', label: 'Todos status' }, // se quiser, pode trocar para "Todos estados"
  { value: 'Ativo', label: statusLabels.Ativo },
  { value: 'Inativo', label: statusLabels.Inativo },
];

const congOptions = [
  { value: '', label: 'Todas congregações' },
  { value: 'Todas', label: 'Todas' },
  ...congregacoes.map((c) => ({ value: c, label: c })),
];

export default function Usuarios() {
  // ✅ botões funcionam (estado local)
  const [usuarios, setUsuarios] = useState(mockUsuarios);

  // filtros
  const [search, setSearch] = useState('');
  const [filtRole, setFiltRole] = useState('');
  const [filtStatus, setFiltStatus] = useState('');
  const [filtCong, setFiltCong] = useState('');

  // modal edição
  const [editing, setEditing] = useState(null);

  // ✅ confirmação desativar (sem alert)
  const [confirmRow, setConfirmRow] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return usuarios.filter((u) => {
      if (q && !u.nome.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (filtRole && u.role !== filtRole) return false;
      if (filtStatus && u.status !== filtStatus) return false;
      if (filtCong && u.congregacao !== filtCong) return false;
      return true;
    });
  }, [usuarios, search, filtRole, filtStatus, filtCong]);

  const hasAnyFilter = !!(search || filtRole || filtStatus || filtCong);

  const clearFilters = () => {
    setSearch('');
    setFiltRole('');
    setFiltStatus('');
    setFiltCong('');
  };

  const toggleStatus = (row) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        (u.id ?? u.email) === (row.id ?? row.email)
          ? { ...u, status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' }
          : u
      )
    );

    toast.success(row.status === 'Ativo' ? 'Usuário desativado' : 'Usuário ativado');
  };

  const requestToggleStatus = (row) => {
    // confirma apenas ao desativar
    if (row.status === 'Ativo') {
      setConfirmRow(row);
      return;
    }
    toggleStatus(row); // ativar direto
  };

  const openEdit = (row) => setEditing({ ...row });

  const saveEdit = () => {
    if (!editing) return;

    setUsuarios((prev) =>
      prev.map((u) => ((u.id ?? u.email) === (editing.id ?? editing.email) ? editing : u))
    );

    toast.success('Usuário atualizado');
    setEditing(null);
  };

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Perfil', render: (v) => roleLabels[v] || v },
    { key: 'congregacao', label: 'Congregacao' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            v === 'Ativo'
              ? 'bg-primary-soft text-primary border-border'
              : 'bg-surface-2 text-muted-foreground border-border'
          }`}
        >
          {statusLabels[v] || v}
        </span>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEdit(row)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
      >
        Editar
      </button>

      <button
        onClick={() => requestToggleStatus(row)}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          row.status === 'Ativo'
            ? 'border-border text-muted-foreground hover:bg-surface-2'
            : 'border-border text-foreground hover:bg-surface-2'
        }`}
      >
        {row.status === 'Ativo' ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  );

  return (
    <AdminLayout title="Usuarios">
      {/* Header padrão */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Usuarios
          </h2>
          <p className="text-sm text-muted-foreground">Controle de acesso e permissões</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <CalendarDays size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{formatTodayPtBR()}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {filtered.length}/{usuarios.length}
            </span>
          </div>
        </div>
      </div>

      <Card>
        {/* Busca */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="input-field pl-10"
            />
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Limpar filtros"
            >
              <X size={16} />
              Limpar
            </button>
          )}
        </div>

        {/* Filtros com React-Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <SelectField
            value={roleOptions.find((o) => o.value === filtRole) || roleOptions[0]}
            onChange={(opt) => setFiltRole(opt?.value || '')}
            options={roleOptions}
            placeholder="Todos perfis"
          />

          <SelectField
            value={statusOptions.find((o) => o.value === filtStatus) || statusOptions[0]}
            onChange={(opt) => setFiltStatus(opt?.value || '')}
            options={statusOptions}
            placeholder="Todos status"
          />

          <SelectField
            value={congOptions.find((o) => o.value === filtCong) || congOptions[0]}
            onChange={(opt) => setFiltCong(opt?.value || '')}
            options={congOptions}
            placeholder="Todas congregações"
          />
        </div>

        {/* Tabela responsiva */}
        <div className="-mx-2 sm:mx-0">
          <div className="overflow-x-auto px-2 sm:px-0">
            <div className="min-w-[980px]">
              <Table columns={columns} data={filtered} actions={actions} />
            </div>
          </div>
        </div>
      </Card>

      {/* Modal editar */}
      {editing && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/35" onClick={() => setEditing(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2">
            <div className="bg-card rounded-2xl border border-border shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">Editar usuário</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Atualize perfil, congregação e status.
                  </p>
                </div>

                <button
                  className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                  onClick={() => setEditing(null)}
                  title="Fechar"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Nome</label>
                  <input
                    value={editing.nome}
                    onChange={(e) => setEditing((p) => ({ ...p, nome: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    value={editing.email}
                    onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Perfil</label>
                  <div className="mt-1">
                    <SelectField
                      value={
                        roleOptions.find((o) => o.value === editing.role) || {
                          value: editing.role,
                          label: roleLabels[editing.role] || editing.role,
                        }
                      }
                      onChange={(opt) => setEditing((p) => ({ ...p, role: opt?.value || '' }))}
                      options={roleOptions.filter((o) => o.value !== '')}
                      placeholder="Selecione"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <div className="mt-1">
                    <SelectField
                      value={
                        statusOptions.find((o) => o.value === editing.status) || {
                          value: editing.status,
                          label: statusLabels[editing.status] || editing.status,
                        }
                      }
                      onChange={(opt) => setEditing((p) => ({ ...p, status: opt?.value || 'Ativo' }))}
                      options={statusOptions.filter((o) => o.value !== '')}
                      placeholder="Selecione"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Congregação</label>
                  <div className="mt-1">
                    <SelectField
                      value={
                        congOptions.find((o) => o.value === editing.congregacao) || {
                          value: editing.congregacao,
                          label: editing.congregacao,
                        }
                      }
                      onChange={(opt) => setEditing((p) => ({ ...p, congregacao: opt?.value || '' }))}
                      options={congOptions.filter((o) => o.value !== '')}
                      placeholder="Selecione"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setEditing(null)}
                  className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={saveEdit}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal confirmação desativar (sem alert) */}
      {confirmRow && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/35" onClick={() => setConfirmRow(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2">
            <div className="bg-card rounded-2xl border border-border shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">
                    Desativar usuário?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O usuário{' '}
                    <span className="font-semibold text-foreground">{confirmRow.nome}</span> perderá acesso ao painel.
                  </p>
                </div>

                <button
                  className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                  onClick={() => setConfirmRow(null)}
                  title="Fechar"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setConfirmRow(null)}
                  className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => {
                    toggleStatus(confirmRow);
                    setConfirmRow(null);
                  }}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  Sim, desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
