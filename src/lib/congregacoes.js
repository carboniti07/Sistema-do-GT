export const congregacoes = [
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

export function formatCongregacao(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .toUpperCase();
}

export function slugifyCongregacao(value) {
  if (!value) return "";

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCongregacaoNome(value) {
  if (!value) return "";

  const normalized = formatCongregacao(value);

  const byName = congregacoes.find(
    (c) => formatCongregacao(c) === normalized
  );
  if (byName) return byName;

  const bySlug = congregacoes.find(
    (c) => slugifyCongregacao(c) === String(value).trim().toLowerCase()
  );
  if (bySlug) return bySlug;

  return String(value);
}