// src/routes/auth.routes.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { config } from "../config.js";
import { auth } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      scope: user.scope,
      congregacaoIds: user.congregacaoIds,
      permissions: user.permissions,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function toSafeUser(u) {
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
  };
}

router.post("/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });

    const email = parsed.data.email.toLowerCase().trim();
    const password = String(parsed.data.password);

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Erro ao fazer login" });
  }
});

router.get("/me", auth, async (req, res) => {
  return res.json({ user: toSafeUser(req.user) });
});

router.post("/change-password", auth, async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Dados inválidos" });

    // auth middleware anexou req.user (lean). Recarrega para atualizar hash.
    const user = await User.findById(req.user._id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Usuário inválido" });
    }

    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Senha atual incorreta" });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    user.passwordHash = newHash;
    user.mustChangePassword = false;
    await user.save();

    const token = signToken(user);

    return res.json({
      token,
      user: toSafeUser(user),
    });
  } catch {
    return res.status(500).json({ message: "Erro ao alterar senha" });
  }
});

export default router;