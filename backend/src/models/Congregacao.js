import mongoose from "mongoose";

const CongregacaoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // use slug: "rudge-ramos"
    nome: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Congregacao = mongoose.model("Congregacao", CongregacaoSchema);