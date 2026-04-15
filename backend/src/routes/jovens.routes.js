import { Router } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { requirePerm } from "../middleware/authorize.js";
import { Jovem } from "../models/Jovem.js";
import { Congregacao } from "../models/Congregacao.js";

const router = Router();

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function normalizeText(value = "") {
  return String(value).trim().replace(/\s+/g, " ").toUpperCase();
}

function isValidCPF(cpf) {
  const digits = onlyDigits(cpf);

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }

  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }

  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  if (secondCheck !== Number(digits[10])) return false;

  return true;
}

function isValidBirthDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  if (date > today) return false;
  if (date.getFullYear() < 1900) return false;

  return true;
}

function safeJovem(j) {
  return {
    id: j._id.toString(),
    congregacaoId: j.congregacaoId,
    nome: j.nome,
    nascimento: j.nascimento,
    sexo: j.sexo,
    cpf: j.cpf,
    telefone: j.telefone,
    cep: j.cep,
    logradouro: j.logradouro,
    numero: j.numero,
    complemento: j.complemento,
    bairro: j.bairro,
    cidade: j.cidade,
    uf: j.uf,
    batismoAguas: !!j.batismoAguas,
    batismoES: !!j.batismoES,
    possuiCargo: !!j.possuiCargo,
    cargo: j.cargo || "",
    lgpd: !!j.lgpd,
    createdBy: j.createdBy,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

function canAccessCongregacao(user, congregacaoId) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.scope === "ALL") return true;
  return Array.isArray(user.congregacaoIds) && user.congregacaoIds.includes(congregacaoId);
}

async function resolveCongregacao(inputValue) {
  const raw = String(inputValue || "").trim();
  if (!raw) return null;

  let congregacao = await Congregacao.findById(raw).lean();
  if (congregacao) return congregacao;

  const all = await Congregacao.find({}, { _id: 1, nome: 1 }).lean();
  const normalizedInput = normalizeText(raw);

  congregacao =
    all.find((c) => normalizeText(c.nome) === normalizedInput) ||
    all.find((c) => normalizeText(c._id) === normalizedInput) ||
    null;

  return congregacao;
}

const createSchema = z.object({
  congregacaoId: z.string().min(1, "Congregação obrigatória"),
  nome: z.string().min(3, "Nome obrigatório").max(150, "Nome muito longo"),
  nascimento: z.string().min(1, "Nascimento obrigatório"),
  sexo: z.enum(["Masculino", "Feminino"]),
  cpf: z.string().min(11, "CPF obrigatório"),
  telefone: z.string().min(10, "Telefone obrigatório"),
  cep: z.string().min(8, "CEP obrigatório"),
  logradouro: z.string().max(150).optional().default(""),
  numero: z.string().min(1, "Número obrigatório").max(20),
  complemento: z.string().max(100).optional().default(""),
  bairro: z.string().max(100).optional().default(""),
  cidade: z.string().max(100).optional().default(""),
  uf: z.string().max(2).optional().default(""),
  batismoAguas: z.boolean(),
  batismoES: z.boolean(),
  possuiCargo: z.boolean(),
  cargo: z.string().max(100).optional().default(""),
  lgpd: z.literal(true),
});

router.post("/", auth, requirePerm("JOVENS_EDIT"), async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message || "Dados inválidos";
      return res.status(400).json({ message: firstIssue });
    }

    const data = parsed.data;

    const congregacao = await resolveCongregacao(data.congregacaoId);
    if (!congregacao) {
      return res.status(400).json({ message: "Congregação inválida" });
    }

    const congregacaoIdReal = String(congregacao._id);

    if (!canAccessCongregacao(req.user, congregacaoIdReal)) {
      return res.status(403).json({ message: "Sem permissão para esta congregação" });
    }

    const cpf = onlyDigits(data.cpf);
    const cep = onlyDigits(data.cep);
    const telefone = onlyDigits(data.telefone);
    const uf = String(data.uf || "").trim().toUpperCase();
    const nome = String(data.nome || "").trim();
    const numero = String(data.numero || "").trim();
    const cargo = String(data.cargo || "").trim();

    if (!isValidCPF(cpf)) {
      return res.status(400).json({ message: "CPF inválido" });
    }

    if (cep.length !== 8) {
      return res.status(400).json({ message: "CEP inválido" });
    }

    if (![10, 11].includes(telefone.length)) {
      return res.status(400).json({ message: "Telefone inválido" });
    }

    if (!isValidBirthDate(data.nascimento)) {
      return res.status(400).json({ message: "Data de nascimento inválida" });
    }

    if (!numero) {
      return res.status(400).json({ message: "Número obrigatório" });
    }

    if (uf && uf.length !== 2) {
      return res.status(400).json({ message: "UF inválida" });
    }

    if (data.possuiCargo && !cargo) {
      return res.status(400).json({ message: "Informe o cargo eclesiástico" });
    }

    if (!data.possuiCargo && cargo) {
      return res.status(400).json({ message: "Cargo enviado sem possuir cargo marcado" });
    }

    const exists = await Jovem.findOne({ cpf }).lean();
    if (exists) {
      return res.status(409).json({ message: "Já existe jovem cadastrado com este CPF" });
    }

    const jovem = await Jovem.create({
      congregacaoId: congregacaoIdReal,
      nome,
      nascimento: new Date(data.nascimento),
      sexo: data.sexo,
      cpf,
      telefone,
      cep,
      logradouro: String(data.logradouro || "").trim(),
      numero,
      complemento: String(data.complemento || "").trim(),
      bairro: String(data.bairro || "").trim(),
      cidade: String(data.cidade || "").trim(),
      uf,
      batismoAguas: data.batismoAguas,
      batismoES: data.batismoES,
      possuiCargo: data.possuiCargo,
      cargo: data.possuiCargo ? cargo : "",
      lgpd: true,
      createdBy: req.user._id,
    });

    return res.status(201).json({ jovem: safeJovem(jovem) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "CPF já cadastrado" });
    }

    return res.status(500).json({ message: "Erro ao cadastrar jovem" });
  }
});

router.get("/", auth, requirePerm("JOVENS_VIEW"), async (req, res) => {
  try {
    const filter = {};

    if (req.user.role !== "ADMIN" && req.user.scope !== "ALL") {
      filter.congregacaoId = { $in: req.user.congregacaoIds || [] };
    }

    const jovens = await Jovem.find(filter).sort({ createdAt: -1 });

    return res.json({ jovens: jovens.map(safeJovem) });
  } catch {
    return res.status(500).json({ message: "Erro ao listar jovens" });
  }
});

router.delete("/:id", auth, requirePerm("JOVENS_EDIT"), async (req, res) => {
  try {
    const jovem = await Jovem.findById(req.params.id);
    if (!jovem) {
      return res.status(404).json({ message: "Jovem não encontrado" });
    }

    if (!canAccessCongregacao(req.user, jovem.congregacaoId)) {
      return res.status(403).json({ message: "Sem permissão para excluir este jovem" });
    }

    await Jovem.findByIdAndDelete(req.params.id);

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: "Erro ao excluir jovem" });
  }
});

export default router;