import { connectDB } from "../db.js";
import { Congregacao } from "../models/Congregacao.js";

const congregacoes = [
  "001 RUDGE RAMOS / SEDE",
  "002 V LIVIERO",
  "003 JD DO LAGO",
  "006 V IDEALOPOLIS",
  "007 JD ABC",
  "008 V NOVA CONQUISTA",
  "010 V VERA",
  "012 V ORIENTAL",
  "014 JD ORION",
  "016 JD GONZAGA",
  "032 JD LAS PALMAS",
  "034 FAZENDA VELHA",
  "043 V BRASIL",
  "044 TORRINOS",
  "050 PR BRISTON",
  "055 JD INAMAR",
  "057 V ARAPUA",
  "061 V FLORIDA",
  "062 JD IPE",
];

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  try {
    await connectDB();

    const docs = congregacoes.map((nome) => ({
      _id: slugify(nome),
      nome,
    }));

    for (const doc of docs) {
      await Congregacao.updateOne(
        { _id: doc._id },
        { $set: { nome: doc.nome } },
        { upsert: true }
      );
    }

    console.log(`Congregações sincronizadas: ${docs.length}`);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao sincronizar congregações:", err);
    process.exit(1);
  }
}

run();