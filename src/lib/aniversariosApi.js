import { api } from "./api";

export function getToken() {
  return localStorage.getItem("gt_token");
}

export async function listAniversariantes(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.periodo) searchParams.set("periodo", params.periodo);
  if (params.mes) searchParams.set("mes", params.mes);
  if (params.congregacaoId) {
    searchParams.set("congregacaoId", params.congregacaoId);
  }

  const query = searchParams.toString();

  return api(`/api/aniversarios${query ? `?${query}` : ""}`, {
    token: getToken(),
  });
}