import { api } from "./api";

export function getToken() {
  return localStorage.getItem("umadrur_token");
}

export async function listJovens() {
  const token = getToken();
  return api("/jovens", { token });
}

export async function createJovem(payload) {
  const token = getToken();
  return api("/jovens", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateJovem(id, payload) {
  const token = getToken();
  return api(`/jovens/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteJovem(id) {
  const token = getToken();
  return api(`/jovens/${id}`, {
    method: "DELETE",
    token,
  });
}