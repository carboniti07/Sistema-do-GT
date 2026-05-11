import { api } from "./api";

const API_URL =
  import.meta.env.VITE_API_URL || "https://sistema-da-umadrur.onrender.com";

export function getToken() {
  return localStorage.getItem("umadrur_token");
}

export async function listCamisaReservas() {
  return api("/api/camisas/reservas", { token: getToken() });
}

export async function getCamisaResumo() {
  return api("/api/camisas/resumo", { token: getToken() });
}

export async function updatePagamentoReserva(id, statusPagamento) {
  return api(`/api/camisas/reservas/${id}/pagamento`, {
    method: "PATCH",
    token: getToken(),
    body: { statusPagamento },
  });
}

export async function anexarComprovanteReserva(id, file) {
  const token = getToken();

  const formData = new FormData();
  formData.append("comprovante", file);

  const res = await fetch(
    `${API_URL}/api/camisas/reservas/${id}/comprovantes`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Erro ao anexar comprovante");

  return data;
}

export async function removerComprovanteReserva(reservaId, comprovanteId) {
  return api(`/api/camisas/reservas/${reservaId}/comprovantes/${comprovanteId}`, {
    method: "DELETE",
    token: getToken(),
  });
}

export async function getCampanhaAtiva() {
  return api("/api/camisas/campanha-ativa");
}

export async function salvarCampanhaAtiva(payload) {
  return api("/api/camisas/campanha-ativa", {
    method: "PATCH",
    token: getToken(),
    body: payload,
  });
}