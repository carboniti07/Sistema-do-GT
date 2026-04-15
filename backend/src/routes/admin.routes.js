import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { auth } from "../middleware/auth.js";
import { requirePerm } from "../middleware/authorize.js";
import { User } from "../models/User.js";
import { Congregacao } from "../models/Congregacao.js";

const router = Router();

const ROLE_ENUM = ["ADMIN", "SECRETARIA_GERAL", "SECRETARIA_LOCAL", "LIDER", "VISUALIZADOR"];
const SCOPE_ENUM = ["ALL", "LIMITED"];

const PERMS = [
  "USERS_MANAGE",
  "CONG_VIEW",
  "CONG_EDIT",
  "JOVENS_VIEW",
  "JOVENS_EDIT",
  "JOVENS_APPROVE",
  "REPORTS_VIEW",
];

function safeUser(u) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    permissions: u.permissions || [],
    scope: u.scope,
    congregacaoIds: u.congregacaoIds || [],
    mustChangePassword: !!u.mustChangePassword,
    isActive: !!u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function uniqueArray(values = []) {
  return [...new Set((values || []).map((v) => String(v).trim()).filter(Boolean))];
}

async function normalizeCongregacaoIds(ids = []) {
  const cleanIds = uniqueArray(ids);
  if (!cleanIds.length) return [];

  const congregacoes = await Congregacao.find(
    { _id: { $in: cleanIds } },
    { _id: 1 }
  ).lean();

  return congregacoes.map((c) => String(c._id));
}

async function resolveAccessRules({ role, scope, congregacaoIds }) {
  const ids = await normalizeCongregacaoIds(congregacaoIds);

  if (role === "ADMIN") {
    return {
      scope: "ALL",
      congregacaoIds: [],
    };
  }

  if (role === "SECRETARIA_GERAL") {
    return {
      scope: "ALL",
      congregacaoIds: [],
    };
  }

  if (role === "SECRETARIA_LOCAL" || role === "LIDER" || role === "VISUALIZADOR") {
    if (!ids.length) {
      throw new Error("Selecione uma congregação para este perfil");
    }

    if (ids.length > 1) {
      throw new Error("Este perfil só pode ter uma congregação vinculada");
    }

    return {
      scope: "LIMITED",
      congregacaoIds: [ids[0]],
    };
  }

  return {
    scope: scope || "LIMITED",
    congregacaoIds: ids,
  };
}

router.get("/users", auth, requirePerm("USERS_MANAGE"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ users: users.map(safeUser) });
  } catch {
    return res.status(500).json({ message: "Erro ao listar usuários" });
  }
});

router.post("/users", auth, requirePerm("USERS_MANAGE"), async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(ROLE_ENUM),
      scope: z.enum(SCOPE_ENUM).optional(),
      congregacaoIds: z.array(z.string().min(1)).optional(),
      permissions: z.array(z.enum(PERMS)).optional(),
      isActive: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const accessRules = await resolveAccessRules({
      role: parsed.data.role,
      scope: parsed.data.scope,
      congregacaoIds: parsed.data.congregacaoIds || [],
    });

    const passwordHash = await bcrypt.hash("123456", 10);

    const user = await User.create({
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: parsed.data.role,
      permissions: parsed.data.permissions || [],
      scope: accessRules.scope,
      congregacaoIds: accessRules.congregacaoIds,
      mustChangePassword: true,
      isActive: parsed.data.isActive ?? true,
    });

    return res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    if (
      err?.message === "Selecione uma congregação para este perfil" ||
      err?.message === "Este perfil só pode ter uma congregação vinculada"
    ) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

router.patch("/users/:id", auth, requirePerm("USERS_MANAGE"), async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      role: z.enum(ROLE_ENUM).optional(),
      scope: z.enum(SCOPE_ENUM).optional(),
      congregacaoIds: z.array(z.string().min(1)).optional(),
      permissions: z.array(z.enum(PERMS)).optional(),
      isActive: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (parsed.data.name !== undefined) {
      user.name = parsed.data.name.trim();
    }

    if (parsed.data.permissions !== undefined) {
      user.permissions = parsed.data.permissions;
    }

    if (parsed.data.isActive !== undefined) {
      user.isActive = parsed.data.isActive;
    }

    const nextRole = parsed.data.role !== undefined ? parsed.data.role : user.role;
    const nextScope = parsed.data.scope !== undefined ? parsed.data.scope : user.scope;
    const nextCongregacaoIds =
      parsed.data.congregacaoIds !== undefined
        ? parsed.data.congregacaoIds
        : user.congregacaoIds || [];

    const accessRules = await resolveAccessRules({
      role: nextRole,
      scope: nextScope,
      congregacaoIds: nextCongregacaoIds,
    });

    user.role = nextRole;
    user.scope = accessRules.scope;
    user.congregacaoIds = accessRules.congregacaoIds;

    await user.save();

    return res.json({ user: safeUser(user) });
  } catch (err) {
    if (
      err?.message === "Selecione uma congregação para este perfil" ||
      err?.message === "Este perfil só pode ter uma congregação vinculada"
    ) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

router.post("/users/:id/reset-password", auth, requirePerm("USERS_MANAGE"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    user.passwordHash = await bcrypt.hash("123456", 10);
    user.mustChangePassword = true;
    await user.save();

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: "Erro ao resetar senha" });
  }
});

export default router;