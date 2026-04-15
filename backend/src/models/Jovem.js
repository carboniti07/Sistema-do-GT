import mongoose from "mongoose";

const JovemSchema = new mongoose.Schema(
  {
    congregacaoId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    nome: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    nascimento: {
      type: Date,
      required: true,
      index: true,
    },

    sexo: {
      type: String,
      enum: ["Masculino", "Feminino"],
      required: true,
    },

    cpf: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    telefone: {
      type: String,
      required: true,
      trim: true,
    },

    cep: {
      type: String,
      required: true,
      trim: true,
    },

    logradouro: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    complemento: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    bairro: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    cidade: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    uf: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2,
    },

    batismoAguas: {
      type: Boolean,
      required: true,
    },

    batismoES: {
      type: Boolean,
      required: true,
    },

    possuiCargo: {
      type: Boolean,
      required: true,
      default: false,
    },

    cargo: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    lgpd: {
      type: Boolean,
      required: true,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Jovem = mongoose.model("Jovem", JovemSchema);