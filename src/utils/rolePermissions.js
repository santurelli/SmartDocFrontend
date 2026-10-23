import authService from '../services/authService';

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  ACCOUNTING: 'ROLE_ACCOUNTING',
  SALES: 'ROLE_SALES',
  WAREHOUSE: 'ROLE_WAREHOUSE',
  WAREHOUSE_OPERATOR: 'ROLE_WAREHOUSE_OPERATOR'
};

export const getUserRole = (user) => {
  const currentUser = user || authService.getCurrentUser()?.user || authService.getCurrentUser();
  const appConfig = authService.getConfig ? authService.getConfig() : {};
  const u = currentUser?.user || currentUser;

  let role = appConfig?.role || currentUser?.role || u?.role;
  if (!role && (u?.nomeGruppo || currentUser?.nomeGruppo)) {
    const nome = (u?.nomeGruppo || currentUser?.nomeGruppo).toUpperCase();
    role = nome.startsWith('ROLE_') ? nome : 'ROLE_' + nome;
  }
  if (!role) {
    role = ROLES.ADMIN;
  }
  return role;
};

export const hasRole = (allowedRoles = [], user) => {
  const currentRole = getUserRole(user);
  if (!currentRole) return false;
  if (currentRole === ROLES.ADMIN) return true;
  return allowedRoles.includes(currentRole);
};
