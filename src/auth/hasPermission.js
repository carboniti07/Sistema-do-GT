import { Perms } from "./permissions.js";

export function hasPermission(user, perm) {
  if (!user?.role) return false;

  const role = String(user.role || "").toUpperCase();
  const scope = String(user.scope || "").toUpperCase();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const congregacaoIds = Array.isArray(user.congregacaoIds)
    ? user.congregacaoIds
    : [];

  const isAdmin = role === "ADMIN";
  const isSecretariaGeral = role === "SECRETARIA_GERAL";
  const isSecretariaLocal = role === "SECRETARIA_LOCAL";
  const isLider = role === "LIDER";
  const isVisualizador = role === "VISUALIZADOR";
  const isCoordenador = role === "COORDENADOR";
  const isTesoureiroCampo = role === "TESOUREIRO_CAMPO";

  if (isAdmin) {
    return true;
  }

  switch (perm) {
    case Perms.VIEW_ALL:
      return (
        isSecretariaGeral ||
        isCoordenador ||
        isTesoureiroCampo ||
        scope === "ALL"
      );

    case Perms.VIEW_OWN_CONG:
      return (
        isSecretariaLocal ||
        isLider ||
        isVisualizador ||
        (scope === "LIMITED" && congregacaoIds.length > 0)
      );

    case Perms.CREATE:
      return (
        permissions.includes("ADOLESCENTES_EDIT") ||
        isSecretariaGeral ||
        isSecretariaLocal ||
        isLider
      );

    case Perms.EDIT:
      return (
        permissions.includes("ADOLESCENTES_EDIT") ||
        isSecretariaGeral ||
        isSecretariaLocal ||
        isLider
      );

    case Perms.APPROVE:
      return (
        permissions.includes("ADOLESCENTES_APPROVE") ||
        isSecretariaGeral ||
        isCoordenador
      );

    case Perms.DELETE:
      return (
        permissions.includes("ADOLESCENTES_EDIT") ||
        isSecretariaGeral ||
        isSecretariaLocal
      );

    case Perms.MANAGE_USERS:
      return permissions.includes("USERS_MANAGE") || isSecretariaGeral;

    case Perms.ADOLESCENTES_VIEW:
      return (
        permissions.includes("ADOLESCENTES_VIEW") ||
        isSecretariaGeral ||
        isSecretariaLocal ||
        isLider ||
        isVisualizador ||
        isCoordenador ||
        isTesoureiroCampo
      );

    case Perms.ADOLESCENTES_EDIT:
      return (
        permissions.includes("ADOLESCENTES_EDIT") ||
        isSecretariaGeral ||
        isSecretariaLocal ||
        isLider ||
        isCoordenador
      );

    case Perms.ADOLESCENTES_APPROVE:
      return (
        permissions.includes("ADOLESCENTES_APPROVE") ||
        isSecretariaGeral ||
        isCoordenador
      );

    case Perms.CAMISAS_VIEW:
      return permissions.includes("CAMISAS_VIEW") || isTesoureiroCampo;

    case Perms.CAMISAS_MANAGE:
      return permissions.includes("CAMISAS_MANAGE") || isTesoureiroCampo;

    case Perms.CAMISAS_FINANCE_MANAGE:
      return permissions.includes("CAMISAS_FINANCE_MANAGE") || isTesoureiroCampo;

    case Perms.CAMISAS_COMPROVANTES_MANAGE:
      return (
        permissions.includes("CAMISAS_COMPROVANTES_MANAGE") ||
        isTesoureiroCampo
      );

    default:
      return false;
  }
}