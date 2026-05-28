import { api } from "./api.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TOKEN_KEY = "gt_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function listCamisaReservas() {
  return api("/api/camisas/reservas", {
    token: getToken(),
  });
}

export async function getCamisaResumo() {
  return api("/api/camisas/resumo", {
    token: getToken(),
  });
}

export async function updatePagamentoReserva(id, statusPagamento) {
  return api(`/api/camisas/reservas/${id}/pagamento`, {
    method: "PATCH",
    token: getToken(),
    body: { statusPagamento },
  });
}

export async function atualizarFinanceiroReserva(id, payload) {
  return api(`/api/camisas/reservas/${id}/financeiro`, {
    method: "PATCH",
    token: getToken(),
    body: payload,
  });
}

export async function atualizarItemReservaCamisa(reservaId, itemId, payload) {
  return api(`/api/camisas/reservas/${reservaId}/itens/${itemId}`, {
    method: "PATCH",
    token: getToken(),
    body: payload,
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Erro ao anexar comprovante");
  }

  return data;
}

export async function removerComprovanteReserva(reservaId, comprovanteId) {
  return api(
    `/api/camisas/reservas/${reservaId}/comprovantes/${comprovanteId}`,
    {
      method: "DELETE",
      token: getToken(),
    }
  );
}

export async function getCampanhaAtiva() {
  return api("/api/camisas/campanha-ativa", {
    token: getToken(),
  });
}

export async function salvarCampanhaAtiva(payload) {
  return api("/api/camisas/campanha-ativa", {
    method: "PATCH",
    token: getToken(),
    body: payload,
  });
}

export async function listCampanhasCamisa() {
  return api("/api/camisas/campanhas", {
    token: getToken(),
  });
}

export async function criarCampanhaCamisa(payload) {
  return api("/api/camisas/campanhas", {
    method: "POST",
    token: getToken(),
    body: payload,
  });
}

export async function atualizarStatusCampanha(id, status) {
  return api(`/api/camisas/campanhas/${id}/status`, {
    method: "PATCH",
    token: getToken(),
    body: { status },
  });
}

export async function excluirCampanhaCamisa(id) {
  return api(`/api/camisas/campanhas/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
}