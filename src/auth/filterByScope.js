import { Perms } from "./permissions";
import { hasPermission } from "./hasPermission";

export function filterByScope(user, rows) {
  if (!user) return [];
  if (hasPermission(user, Perms.VIEW_ALL)) return rows;
  return rows.filter((r) => r.congregacaoId === user.congregacaoId);
}