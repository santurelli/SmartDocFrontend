import { describe, it, expect } from 'vitest';
import { getUserRole, hasRole, ROLES } from '../utils/rolePermissions';

describe('Role Permissions Unit Tests', () => {
    it('correctly resolves role by role name or nomeGruppo', () => {
        expect(getUserRole({ role: 'ROLE_ADMIN' })).toBe(ROLES.ADMIN);
        expect(getUserRole({ nomeGruppo: 'ACCOUNTING' })).toBe(ROLES.ACCOUNTING);
        expect(getUserRole({ nomeGruppo: 'SALES' })).toBe(ROLES.SALES);
        expect(getUserRole({ nomeGruppo: 'WAREHOUSE' })).toBe(ROLES.WAREHOUSE);
        expect(getUserRole({ nomeGruppo: 'WAREHOUSE_OPERATOR' })).toBe(ROLES.WAREHOUSE_OPERATOR);
    });

    it('ADMIN hasRole returns true for any allowedRoles list', () => {
        const adminUser = { role: ROLES.ADMIN };
        expect(hasRole(['ROLE_WAREHOUSE'], adminUser)).toBe(true);
        expect(hasRole(['ROLE_ACCOUNTING'], adminUser)).toBe(true);
        expect(hasRole(['ROLE_SALES'], adminUser)).toBe(true);
    });

    it('WAREHOUSE has access to warehouse items, but blocked from accounting and configuration', () => {
        const warehouseUser = { role: ROLES.WAREHOUSE };
        expect(hasRole(['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE'], warehouseUser)).toBe(true);
        expect(hasRole(['ROLE_ACCOUNTING'], warehouseUser)).toBe(false);
        expect(hasRole(['ROLE_ADMIN'], warehouseUser)).toBe(false);
        expect(hasRole(['ROLE_SALES'], warehouseUser)).toBe(false);
    });

    it('SALES has access to sales items, but blocked from accounting and warehouse', () => {
        const salesUser = { role: ROLES.SALES };
        expect(hasRole(['ROLE_ACCOUNTING', 'ROLE_SALES'], salesUser)).toBe(true);
        expect(hasRole(['ROLE_ACCOUNTING'], salesUser)).toBe(false);
        expect(hasRole(['ROLE_WAREHOUSE'], salesUser)).toBe(false);
        expect(hasRole(['ROLE_ADMIN'], salesUser)).toBe(false);
    });

    it('WAREHOUSE_OPERATOR has access only to warehouse/articles, but blocked from documents, suppliers and finance', () => {
        const operatorUser = { role: ROLES.WAREHOUSE_OPERATOR };
        expect(hasRole(['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR'], operatorUser)).toBe(true);
        expect(hasRole(['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE'], operatorUser)).toBe(false);
        expect(hasRole(['ROLE_ACCOUNTING'], operatorUser)).toBe(false);
        expect(hasRole(['ROLE_ADMIN'], operatorUser)).toBe(false);
    });
});
