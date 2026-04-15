import bcrypt from "bcrypt";
import { connectDB } from "../db.js";
import { User } from "../models/User.js";

async function seedAdmin() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: "admin@umadrur.com" });
    if (existing) {
      console.log("Admin já existe.");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash("123456", 10);

    await User.create({
      name: "Administrador",
      email: "admin@umadrur.com",
      passwordHash,
      role: "ADMIN",
      permissions: [
        "USERS_MANAGE",
        "CONG_VIEW",
        "CONG_EDIT",
        "JOVENS_VIEW",
        "JOVENS_EDIT",
        "JOVENS_APPROVE",
        "REPORTS_VIEW",
      ],
      scope: "ALL",
      congregacaoIds: [],
      mustChangePassword: true,
      isActive: true,
    });

    console.log("Admin criado com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao criar admin:", err);
    process.exit(1);
  }
}

seedAdmin();