import React, { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Card from "../../components/Card";
import Table from "../../components/Table";
import SelectField from "../../components/SelectField";
import {
  congregacoes,
  formatCongregacao,
  getCongregacaoNome,
  slugifyCongregacao,
} from "../../lib/congregacoes";
import { toast } from "sonner";
import { Search, CalendarDays, Users, X, RotateCcw, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import { useAuth } from "../../auth/AuthContext.jsx";

const TOKEN_KEY = "umadrur_token";

const roleLabels = {
  ADMIN: "Administrador",
  SECRETARIA_GERAL: "Secretaria Geral",
  SECRETARIA_LOCAL: "Secretaria Local",
  LIDER: "Líder",
  VISUALIZADOR: "Visualizador",
  COORDENADOR: "Coordenador",
  TESOUREIRO_CAMPO: "Tesoureiro Campo",
};

const scopeLabels = {
  ALL: "Todas",
  LIMITED: "Somente liberadas",
};

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

const roleOptions = [
  { value: "", label: "Todos perfis" },
  { value: "ADMIN", label: roleLabels.ADMIN },
  { value: "SECRETARIA_GERAL", label: roleLabels.SECRETARIA_GERAL },
  { value: "SECRETARIA_LOCAL", label: roleLabels.SECRETARIA_LOCAL },
  { value: "LIDER", label: roleLabels.LIDER },
  { value: "VISUALIZADOR", label: roleLabels.VISUALIZADOR },
  { value: "COORDENADOR", label: roleLabels.COORDENADOR },
  { value: "TESOUREIRO_CAMPO", label: roleLabels.TESOUREIRO_CAMPO },
];

const statusOptions = [
  { value: "", label: "Todos status" },
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" },
];

const congOptions = [
  { value: "", label: "Todas congregações" },
  ...congregacoes.map((c) => ({
    value: slugifyCongregacao(c),
    label: c,
  })),
];

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function adminListUsers() {
  const token = getToken();
  return api("/admin/users", { token });
}

async function adminCreateUser(payload) {
  const token = getToken();
  return api("/admin/users", { method: "POST", token, body: payload });
}

async function adminUpdateUser(id, payload) {
  const token = getToken();
  return api(`/admin/users/${id}`, { method: "PATCH", token, body: payload });
}

async function adminResetPassword(id) {
  const token = getToken();
  return api(`/admin/users/${id}/reset-password`, { method: "POST", token });
}

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "ok"
      ? "bg-primary-soft text-primary border-border"
      : tone === "warn"
      ? "bg-surface-2 text-muted-foreground border-border"
      : "bg-card text-muted-foreground border-border";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

function getRoleScope(role) {
  if (
    role === "ADMIN" ||
    role === "SECRETARIA_GERAL" ||
    role === "COORDENADOR" ||
    role === "TESOUREIRO_CAMPO"
  ) {
    return "ALL";
  }

  return "LIMITED";
}

function roleNeedsCongregacao(role) {
  return ["SECRETARIA_LOCAL", "LIDER", "VISUALIZADOR"].includes(role);
}

export default function Usuarios() {
  const qc = useQueryClient();
  const { hasPerm } = useAuth();

  const canCreateUsers = hasPerm("USERS_CREATE");
  const canEditUsers = hasPerm("USERS_EDIT");

  const [search, setSearch] = useState("");
  const [filtRole, setFiltRole] = useState("");
  const [filtStatus, setFiltStatus] = useState("");
  const [filtCong, setFiltCong] = useState("");

  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const [confirmRow, setConfirmRow] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminListUsers,
    staleTime: 10_000,
  });

  const usersRaw = data?.users || [];

  const usuarios = useMemo(() => {
    return usersRaw.map((u) => {
      const ids = Array.isArray(u.congregacaoIds) ? u.congregacaoIds : [];
      const firstCongId = ids[0] || "";
      const firstCongNome = getCongregacaoNome(firstCongId);

      return {
        id: u.id,
        nome: u.name,
        email: u.email,
        role: u.role,
        scope: u.scope,
        congregacao: firstCongNome,
        congregacaoId: firstCongId,
        congregacaoIds: ids,
        permissions: u.permissions || [],
        mustChangePassword: !!u.mustChangePassword,
        status: u.isActive ? "Ativo" : "Inativo",
        isActive: !!u.isActive,
      };
    });
  }, [usersRaw]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return usuarios.filter((u) => {
      if (q && !u.nome.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (filtRole && u.role !== filtRole) return false;
      if (filtStatus && u.status !== filtStatus) return false;

      if (filtCong && u.congregacaoId !== filtCong) return false;

      return true;
    });
  }, [usuarios, search, filtRole, filtStatus, filtCong]);

  const hasAnyFilter = !!(search || filtRole || filtStatus || filtCong);

  const clearFilters = () => {
    setSearch("");
    setFiltRole("");
    setFiltStatus("");
    setFiltCong("");
  };

  const openEdit = (row) => {
    if (!canEditUsers) {
      toast.error("Você não tem permissão para editar usuários");
      return;
    }

    setCreating(false);
    setEditing({
      id: row.id,
      nome: row.nome,
      email: row.email,
      role: row.role,
      scope: row.scope,
      congregacaoId: row.congregacaoId || "",
      status: row.status,
    });
  };

  const openCreate = () => {
    if (!canCreateUsers) {
      toast.error("Você não tem permissão para criar usuários");
      return;
    }

    setCreating(true);
    setEditing({
      id: null,
      nome: "",
      email: "",
      role: "SECRETARIA_LOCAL",
      scope: "LIMITED",
      congregacaoId: "",
      status: "Ativo",
    });
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const saveUser = async () => {
    if (!editing) return;

    const name = String(editing.nome || "").trim();
    const email = String(editing.email || "").trim().toLowerCase();
    const role = editing.role;
    const scope = getRoleScope(role);
    const isActive = editing.status === "Ativo";
    const needsCong = roleNeedsCongregacao(role);
    const congregacaoId = String(editing.congregacaoId || "").trim();

    if (!name) {
      toast.error("Informe o nome");
      return;
    }

    if (creating && !email) {
      toast.error("Informe o email");
      return;
    }

    if (needsCong && !congregacaoId) {
      toast.error("Selecione a congregação para este perfil");
      return;
    }

    const payload = {
      name,
      role,
      scope,
      congregacaoIds: needsCong ? [congregacaoId] : [],
      isActive,
    };

    if (creating) {
      payload.email = email;
    }

    if (creating && !canCreateUsers) {
      toast.error("Você não tem permissão para criar usuários");
      return;
    }

    if (!creating && !canEditUsers) {
      toast.error("Você não tem permissão para editar usuários");
      return;
    }

    try {
      setSaving(true);

      if (creating) {
        await adminCreateUser(payload);
        toast.success("Usuário criado com sucesso. Senha padrão: 123456");
      } else {
        await adminUpdateUser(editing.id, payload);
        toast.success("Usuário atualizado com sucesso");
      }

      closeModal();
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e?.message || "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    if (!canEditUsers) {
      toast.error("Você não tem permissão para alterar status de usuários");
      return;
    }

    try {
      const nextActive = row.status !== "Ativo";
      await adminUpdateUser(row.id, { isActive: nextActive });
      toast.success(nextActive ? "Usuário ativado" : "Usuário desativado");
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e?.message || "Erro ao alterar status");
    }
  };

  const requestToggleStatus = (row) => {
    if (row.status === "Ativo") {
      setConfirmRow(row);
      return;
    }
    toggleStatus(row);
  };

  const handleResetPassword = async (row) => {
    if (!canEditUsers) {
      toast.error("Você não tem permissão para resetar senhas");
      return;
    }

    try {
      await adminResetPassword(row.id);
      toast.success("Senha resetada para 123456");
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e?.message || "Erro ao resetar senha");
    }
  };

  const columns = [
    { key: "nome", label: "Nome" },
    { key: "email", label: "Email" },
    { key: "role", label: "Perfil", render: (v) => roleLabels[v] || v },
    {
      key: "scope",
      label: "Escopo",
      render: (v) => <span className="text-sm text-muted-foreground">{scopeLabels[v] || v}</span>,
    },
    {
      key: "congregacao",
      label: "Congregação",
      render: (v) => (
        <span className="text-sm text-foreground truncate block max-w-[340px]" title={v}>
          {v || "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <Pill tone={v === "Ativo" ? "ok" : "warn"}>{v}</Pill>,
    },
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      {canEditUsers && (
      <button
        onClick={() => openEdit(row)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-2 transition-colors"
      >
        Editar
      </button>
      )}

      {canEditUsers && (
      <button
        onClick={() => requestToggleStatus(row)}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          row.status === "Ativo"
            ? "border-border text-muted-foreground hover:bg-surface-2"
            : "border-border text-foreground hover:bg-surface-2"
        }`}
      >
        {row.status === "Ativo" ? "Desativar" : "Ativar"}
      </button>
      )}

      {canEditUsers && (
      <button
        onClick={() => handleResetPassword(row)}
        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
        title="Resetar senha para 123456"
      >
        <RotateCcw size={14} />
        Reset
      </button>
      )}

      {!canEditUsers && (
        <span className="text-xs text-muted-foreground">Somente criação/visualização</span>
      )}
    </div>
  );

  return (
    <AdminLayout title="Usuários">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
            Usuários
          </h2>
          <p className="text-sm text-muted-foreground">Controle de acesso e permissões</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
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

          {canCreateUsers && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground px-4 text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              <Plus size={16} />
              Novo usuário
            </button>
          )}
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 h-10 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Recarregar"
            >
              Recarregar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <SelectField
            value={roleOptions.find((o) => o.value === filtRole) || roleOptions[0]}
            onChange={(opt) => setFiltRole(opt?.value || "")}
            options={roleOptions}
            placeholder="Todos perfis"
          />

          <SelectField
            value={statusOptions.find((o) => o.value === filtStatus) || statusOptions[0]}
            onChange={(opt) => setFiltStatus(opt?.value || "")}
            options={statusOptions}
            placeholder="Todos status"
          />

          <SelectField
            value={congOptions.find((o) => o.value === filtCong) || congOptions[0]}
            onChange={(opt) => setFiltCong(opt?.value || "")}
            options={congOptions}
            placeholder="Todas congregações"
          />
        </div>

        {isLoading && <div className="text-sm text-muted-foreground py-6">Carregando usuários...</div>}

        {isError && (
          <div className="text-sm text-red-600 py-6">
            {error?.message || "Erro ao carregar usuários"}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="-mx-2 sm:mx-0">
            <div className="overflow-x-auto px-2 sm:px-0">
              <div className="min-w-[980px]">
                <Table columns={columns} data={filtered} actions={actions} />
              </div>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/35" onClick={closeModal} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[620px] -translate-x-1/2 -translate-y-1/2">
            <div className="bg-card rounded-2xl border border-border shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">
                    {creating ? "Novo usuário" : "Editar usuário"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {creating
                      ? "A senha inicial será 123456 e o primeiro acesso será obrigatório."
                      : "Atualize perfil, congregação e status."}
                  </p>
                </div>

                <button className="p-2 rounded-lg hover:bg-surface-2 transition-colors" onClick={closeModal} title="Fechar">
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
                    placeholder="Nome completo"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    value={editing.email}
                    onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))}
                    className={`input-field mt-1 ${creating ? "" : "opacity-70"}`}
                    placeholder="email@dominio.com"
                    disabled={!creating}
                  />
                  {!creating && <p className="text-xs text-muted-foreground mt-1">Email não pode ser alterado.</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Perfil</label>
                  <div className="mt-1">
                    <SelectField
                      value={{ value: editing.role, label: roleLabels[editing.role] || editing.role }}
                      onChange={(opt) =>
                        setEditing((p) => {
                          const nextRole = opt?.value || "VISUALIZADOR";
                          const nextScope = getRoleScope(nextRole);
                          const needsCong = roleNeedsCongregacao(nextRole);

                          return {
                            ...p,
                            role: nextRole,
                            scope: nextScope,
                            congregacaoId: needsCong ? p.congregacaoId : "",
                          };
                        })
                      }
                      options={roleOptions.filter((o) => o.value !== "")}
                      placeholder="Selecione"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <div className="mt-1">
                    <SelectField
                      value={{ value: editing.status, label: editing.status }}
                      onChange={(opt) => setEditing((p) => ({ ...p, status: opt?.value || "Ativo" }))}
                      options={statusOptions.filter((o) => o.value !== "")}
                      placeholder="Selecione"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Escopo aplicado</label>
                  <div className="mt-1 h-11 rounded-xl border border-border bg-surface-2/60 px-3 flex items-center text-sm text-foreground">
                    {scopeLabels[getRoleScope(editing.role)]}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O escopo é definido automaticamente conforme o perfil.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Congregação</label>
                  <div className="mt-1">
                    <SelectField
                      value={
                        congOptions.find((o) => o.value === editing.congregacaoId) || null
                      }
                      onChange={(opt) => setEditing((p) => ({ ...p, congregacaoId: opt?.value || "" }))}
                      options={congOptions.filter((o) => o.value !== "")}
                      placeholder="Selecione"
                      isDisabled={!roleNeedsCongregacao(editing.role)}
                    />
                  </div>
                  {roleNeedsCongregacao(editing.role) ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Obrigatória para este perfil.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Este perfil possui acesso global e não usa congregação fixa.
                    </p>
                  )}
                </div>

                {!creating && canEditUsers && (
                  <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Senha</p>
                      <p className="text-xs text-muted-foreground">
                        Reset volta para <span className="font-semibold">123456</span> e obriga primeiro acesso.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          setSaving(true);
                          await adminResetPassword(editing.id);
                          toast.success("Senha resetada para 123456");
                          await qc.invalidateQueries({ queryKey: ["admin-users"] });
                        } catch (e) {
                          toast.error(e?.message || "Erro ao resetar senha");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-2"
                      disabled={saving}
                    >
                      <RotateCcw size={16} />
                      Resetar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={closeModal}
                  className="h-10 px-4 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  onClick={saveUser}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 transition-opacity"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : creating ? "Criar usuário" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmRow && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/35" onClick={() => setConfirmRow(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2">
            <div className="bg-card rounded-2xl border border-border shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">Desativar usuário?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O usuário <span className="font-semibold text-foreground">{confirmRow.nome}</span> perderá acesso ao painel.
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
                    (async () => {
                      try {
                        const nextActive = confirmRow.status !== "Ativo";
                        await adminUpdateUser(confirmRow.id, { isActive: nextActive });
                        toast.success(nextActive ? "Usuário ativado" : "Usuário desativado");
                        await qc.invalidateQueries({ queryKey: ["admin-users"] });
                      } catch (e) {
                        toast.error(e?.message || "Erro ao alterar status");
                      } finally {
                        setConfirmRow(null);
                      }
                    })();
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