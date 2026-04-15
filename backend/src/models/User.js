import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["ADMIN", "SECRETARIA_GERAL", "SECRETARIA_LOCAL", "LIDER", "VISUALIZADOR"],
      required: true,
    },

    permissions: { type: [String], default: [] },

    scope: { type: String, enum: ["ALL", "LIMITED"], default: "LIMITED" },
    congregacaoIds: { type: [String], default: [] },

    mustChangePassword: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);