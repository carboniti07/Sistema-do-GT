import { api } from "./api.js";

const TOKEN_KEY = "gt_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function listAdolescentes() {
  return api("/adolescentes", {
    token: getToken(),
  });
}

export function createAdolescente(payload) {
  return api("/adolescentes", {
    method: "POST",
    body: payload,
    token: getToken(),
  });
}

export function updateAdolescente(id, payload) {
  return api(`/adolescentes/${id}`, {
    method: "PATCH",
    body: payload,
    token: getToken(),
  });
}

export function deleteAdolescente(id) {
  return api(`/adolescentes/${id}`, {
    method: "DELETE",
    token: getToken(),
  });
}

export function buscarAdolescentePorCpf(cpf) {
  return api(`/adolescentes/buscar-por-cpf/${cpf}`);
}