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

/**
 * Normaliza para bater com a lista oficial (evita erro por espaços/caixa).
 * - remove espaços extras
 * - mantém "/" com espaços padronizados
 * - mantém em MAIÚSCULO
 */
export function formatCongregacao(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .toUpperCase();
}
