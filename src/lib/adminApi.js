import { api } from "./api";

export function getToken() {
  return localStorage.getItem("umadrur_token");
}

export async function adminListUsers() {
  const token = getToken();
  return api("/admin/users", { token });
}

export async function adminCreateUser(payload) {
  const token = getToken();
  return api("/admin/users", { method: "POST", token, body: payload });
}

export async function adminUpdateUser(id, payload) {
  const token = getToken();
  return api(`/admin/users/${id}`, { method: "PATCH", token, body: payload });
}

export async function adminResetPassword(id) {
  const token = getToken();
  return api(`/admin/users/${id}/reset-password`, { method: "POST", token });
}