import { api } from "./api";
import { getToken } from "./adminApi";

export async function createJovem(payload) {
  const token = getToken();
  return api("/jovens", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function listJovens() {
  const token = getToken();
  return api("/jovens", { token });
}

export async function deleteJovem(id) {
  const token = getToken();
  return api(`/jovens/${id}`, {
    method: "DELETE",
    token,
  });
}