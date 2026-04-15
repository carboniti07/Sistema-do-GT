import { Roles } from "./roles";
import { Perms } from "./permissions";

export const rolePermissions = Object.freeze({
  [Roles.ADMIN]: [
    Perms.VIEW_ALL,
    Perms.CREATE,
    Perms.EDIT,
    Perms.APPROVE,
    Perms.DELETE,
    Perms.MANAGE_USERS,
  ],
  [Roles.SECRETARIA]: [
    Perms.VIEW_ALL,
    Perms.CREATE,
    Perms.EDIT,
    Perms.APPROVE,
  ],
  [Roles.LIDER]: [Perms.VIEW_OWN_CONG],
  [Roles.VISUALIZADOR]: [Perms.VIEW_OWN_CONG],
});