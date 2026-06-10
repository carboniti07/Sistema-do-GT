import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Gift,
  MessageCircle,
  RefreshCcw,
  Search,
  X,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "../../components/AdminLayout.jsx";
import Card from "../../components/Card.jsx";
import Table from "../../components/Table.jsx";
import SelectField from "../../components/SelectField.jsx";
import Button from "../../components/Button.jsx";

import { listAniversariantes } from "../../lib/aniversariosApi.js";
import { congregacoes, getCongregacaoNome } from "../../lib/congregacoes.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Perms } from "../../auth/permissions.js";
import { hasPermission } from "../../auth/hasPermission.js";

const periodoOptions = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Próximos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "proximo30", label: "Próximos 30 dias" },
  { value: "todos", label: "Todos" },
];

const modeloOptions = [
  { value: "local", label: "Mensagem do líder local" },
  { value: "geral", label: "Mensagem do Geração Teen" },
];

function onlyDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function formatPhone(value = "") {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return value || "-";
}

function formatDateBR(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
}

function calcAge(nascimento) {
  if (!nascimento) return 0;

  const today = new Date();
  const birth = new Date(nascimento);

  if (Number.isNaN(birth.getTime())) return 0;

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function nextBirthdayDate(nascimento) {
  const birth = new Date(nascimento);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  const currentYear = today.getFullYear();

  let next = new Date(currentYear, birth.getMonth(), birth.getDate());

  today.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);

  if (next < today) {
    next = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    next.setHours(0, 0, 0, 0);
  }

  return next;
}

function daysUntilBirthday(nascimento) {
  const next = nextBirthdayDate(nascimento);

  if (!next) return 9999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function birthdayMonth(nascimento) {
  const birth = new Date(nascimento);

  if (Number.isNaN(birth.getTime())) return -1;

  return birth.getMonth();
}

function birthdayDay(nascimento) {
  const birth = new Date(nascimento);

  if (Number.isNaN(birth.getTime())) return -1;

  return birth.getDate();
}

function isInPeriod(adolescente, periodo) {
  const dias = daysUntilBirthday(adolescente.nascimento);
  const today = new Date();

  if (periodo === "hoje") return dias === 0;
  if (periodo === "semana") return dias >= 0 && dias <= 7;
  if (periodo === "proximo30") return dias >= 0 && dias <= 30;

  if (periodo === "mes") {
    return birthdayMonth(adolescente.nascimento) === today.getMonth();
  }

  return true;
}

function getDefaultMessageModel(user) {
  const role = String(user?.role || "").toUpperCase();

  if (role === "LIDER" || role === "SECRETARIA_LOCAL") {
    return "local";
  }

  return "geral";
}

function buildBirthdayMessage(adolescente, modelo) {
  const nome = String(adolescente?.nome || "").split(" ")[0] || "querido(a)";

  if (modelo === "local") {
    return `Paz do Senhor, ${nome}!

Hoje lembrei de você e queria te desejar um feliz aniversário.

Que Deus cuide do seu coração, dos seus sonhos e dos seus caminhos. Continue firme, porque sua vida é importante para Deus e para nós.

Aproveite seu dia. Feliz aniversário!`;
  }

  return `Paz do Senhor, ${nome}!

Em nome do Geração Teen, queremos celebrar sua vida hoje.

Que o Senhor te fortaleça, te dê direção e faça este novo ciclo ser marcado por crescimento, alegria e presença de Deus.

Receba nosso carinho. Feliz aniversário!`;
}

function getWhatsAppPhone(value = "") {
  const digits = onlyDigits(value);

  if (!digits) return "";

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

function openWhatsApp(adolescente, modelo) {
  if (!adolescente?.autorizaWhatsApp) {
    toast.error("WhatsApp não autorizado pelo responsável");
    return;
  }

  const phone = getWhatsAppPhone(adolescente.telefone);

  if (!phone) {
    toast.error("Telefone do adolescente inválido");
    return;
  }

  const text = buildBirthdayMessage(adolescente, modelo);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Aniversarios() {
  const { user } = useAuth();

  const [adolescentes, setAdolescentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [periodo, setPeriodo] = useState("mes");
  const [congregacao, setCongregacao] = useState("");
  const [search, setSearch] = useState("");
  const [modelo, setModelo] = useState(() => getDefaultMessageModel(user));

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

    const data = await listAniversariantes({
      periodo,
      congregacaoId: congregacao,
    });

    setAdolescentes(
      Array.isArray(data?.aniversariantes) ? data.aniversariantes : []
    );
  } catch (err) {
    toast.error(err?.message || "Erro ao carregar aniversariantes");
    setAdolescentes([]);
  } finally {
    setLoading(false);
  }
}

 useEffect(() => {
  loadData();
}, [periodo, congregacao]);

  const filtered = useMemo(() => {
    return adolescentes
      .filter((adolescente) => {
        const congregacaoNome = getCongregacaoNome(adolescente.congregacaoId);

        if (!isInPeriod(adolescente, periodo)) return false;

        if (!isLimited && congregacao && congregacaoNome !== congregacao) {
          return false;
        }

        if (search) {
          const term = search.toLowerCase();

          const searchable = [
            adolescente.nome,
            adolescente.telefone,
            adolescente.responsavelNome,
            adolescente.responsavelTelefone,
            congregacaoNome,
          ]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");

          if (!searchable.includes(term)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const diff = daysUntilBirthday(a.nascimento) - daysUntilBirthday(b.nascimento);

        if (diff !== 0) return diff;

        return String(a.nome || "").localeCompare(String(b.nome || ""));
      });
  }, [adolescentes, periodo, congregacao, search, isLimited]);

  const totalAutorizados = filtered.filter((a) => a.autorizaWhatsApp).length;
  const totalSemAutorizacao = filtered.length - totalAutorizados;

  const columns = [
    { key: "nome", label: "Nome" },
    {
      key: "nascimento",
      label: "Nascimento",
      render: (value) => formatDateBR(value),
    },
    {
      key: "idade",
      label: "Idade",
      render: (_, row) => `${calcAge(row.nascimento)} anos`,
    },
    {
      key: "dias",
      label: "Quando",
      render: (_, row) => {
        const dias = daysUntilBirthday(row.nascimento);

        if (dias === 0) return "Hoje";
        if (dias === 1) return "Amanhã";

        return `Em ${dias} dias`;
      },
    },
    {
      key: "congregacaoId",
      label: "Congregação",
      render: (value) => getCongregacaoNome(value),
    },
    {
      key: "telefone",
      label: "WhatsApp adolescente",
      render: (value) => formatPhone(value),
    },
    {
      key: "autorizaWhatsApp",
      label: "Autorização",
      render: (value) =>
        value ? (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Autorizado
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            Não autorizado
          </span>
        ),
    },
    {
      key: "acoes",
      label: "Mensagem",
      render: (_, row) => {
        if (!row.autorizaWhatsApp) {
          return (
            <div className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              <ShieldAlert size={14} />
              WhatsApp não autorizado
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => openWhatsApp(row, modelo)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity"
          >
            <MessageCircle size={15} />
            Enviar
          </button>
        );
      },
    },
  ];

  const clearFilters = () => {
    setPeriodo("mes");
    setCongregacao("");
    setSearch("");
    setModelo(getDefaultMessageModel(user));
  };

  return (
    <AdminLayout title="Aniversários">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight">
              Aniversários
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Controle de aniversariantes e envio manual de mensagem pelo WhatsApp.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors"
          >
            <RefreshCcw size={16} className="text-muted-foreground" />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gift size={20} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Filtrados</p>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {loading ? "..." : filtered.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <MessageCircle size={20} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Autorizados</p>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {loading ? "..." : totalAutorizados}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <ShieldAlert size={20} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Sem autorização</p>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {loading ? "..." : totalSemAutorizacao}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone, responsável ou congregação..."
                className="input-field pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-[680px]">
              <SelectField
                value={
                  periodoOptions.find((option) => option.value === periodo) ||
                  periodoOptions[0]
                }
                onChange={(option) => setPeriodo(option?.value || "mes")}
                options={periodoOptions}
                placeholder="Período"
              />

              {!isLimited ? (
                <SelectField
                  value={
                    congOptions.find((option) => option.value === congregacao) ||
                    congOptions[0]
                  }
                  onChange={(option) => setCongregacao(option?.value || "")}
                  options={congOptions}
                  placeholder="Congregação"
                />
              ) : (
                <div className="hidden sm:block" />
              )}

              <SelectField
                value={
                  modeloOptions.find((option) => option.value === modelo) ||
                  modeloOptions[0]
                }
                onChange={(option) => setModelo(option?.value || "local")}
                options={modeloOptions}
                placeholder="Modelo de mensagem"
              />
            </div>

            <Button type="button" variant="secondary" onClick={clearFilters}>
              <X size={16} />
              Limpar
            </Button>
          </div>

          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex items-start gap-2">
              <CalendarDays size={18} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">Regra de envio</p>
                <p className="mt-1 leading-relaxed">
                  A mensagem de aniversário é enviada para o WhatsApp do adolescente
                  somente quando o responsável autorizou contato por WhatsApp no cadastro.
                  Para campanhas de camisas e assuntos financeiros, o contato deve ser
                  feito pelo telefone do responsável.
                </p>
              </div>
            </div>
          </div>

          <Table columns={columns} data={filtered} />
        </Card>
      </div>
    </AdminLayout>
  );
}