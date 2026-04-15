import { Perms } from "./permissions.js";

export function hasPermission(user, perm) {
  if (!user?.role) return false;

  const role = String(user.role || "").toUpperCase();
  const scope = String(user.scope || "").toUpperCase();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const congregacaoIds = Array.isArray(user.congregacaoIds) ? user.congregacaoIds : [];

  const isAdmin = role === "ADMIN";
  const isSecretariaGeral = role === "SECRETARIA_GERAL";
  const isSecretariaLocal = role === "SECRETARIA_LOCAL";
  const isLider = role === "LIDER";
  const isVisualizador = role === "VISUALIZADOR";

  if (isAdmin) {
    return true;
  }

  switch (perm) {
    case Perms.VIEW_ALL:
      return isSecretariaGeral || scope === "ALL";

    case Perms.VIEW_OWN_CONG:
      return (
        isSecretariaLocal ||
        isLider ||
        isVisualizador ||
        (scope === "LIMITED" && congregacaoIds.length > 0)
      );

    case Perms.CREATE:
      return permissions.includes("JOVENS_EDIT") || isSecretariaGeral || isSecretariaLocal || isLider;

    case Perms.EDIT:
      return permissions.includes("JOVENS_EDIT") || isSecretariaGeral || isSecretariaLocal || isLider;

    case Perms.APPROVE:
      return permissions.includes("JOVENS_APPROVE") || isSecretariaGeral;

    case Perms.DELETE:
      return permissions.includes("JOVENS_EDIT") || isSecretariaGeral || isSecretariaLocal;

    case Perms.MANAGE_USERS:
      return permissions.includes("USERS_MANAGE") || isSecretariaGeral;

    default:
      return false;
  }
}