/**
 * Модуль RBAC (Role-Based Access Control)
 * Разделение доступа к дашбордам и данным
 */

import React from 'react';

export enum Role {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  FLIGHT_MANAGER = 'flight_manager',
}

export enum Permission {
  // Дашборды
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_CREATE = 'dashboard:create',
  DASHBOARD_EDIT = 'dashboard:edit',
  DASHBOARD_DELETE = 'dashboard:delete',
  
  // Чарты
  CHART_VIEW = 'chart:view',
  CHART_CREATE = 'chart:create',
  CHART_EDIT = 'chart:edit',
  CHART_DELETE = 'chart:delete',
  
  // Датасеты
  DATASET_VIEW = 'dataset:view',
  DATASET_CREATE = 'dataset:create',
  DATASET_EDIT = 'dataset:edit',
  DATASET_DELETE = 'dataset:delete',
  
  // Пользователи
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  
  // Рейсы (специфично для ООО "Аэронавигатор")
  FLIGHT_DATA_VIEW = 'flight:view',
  FLIGHT_DATA_EDIT = 'flight:edit',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.ANALYST]: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_CREATE,
    Permission.DASHBOARD_EDIT,
    Permission.CHART_VIEW,
    Permission.CHART_CREATE,
    Permission.CHART_EDIT,
    Permission.DATASET_VIEW,
    Permission.DATASET_CREATE,
    Permission.DATASET_EDIT,
    Permission.FLIGHT_DATA_VIEW,
  ],
  [Role.VIEWER]: [
    Permission.DASHBOARD_VIEW,
    Permission.CHART_VIEW,
    Permission.DATASET_VIEW,
    Permission.FLIGHT_DATA_VIEW,
  ],
  [Role.FLIGHT_MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_CREATE,
    Permission.CHART_VIEW,
    Permission.CHART_CREATE,
    Permission.DATASET_VIEW,
    Permission.FLIGHT_DATA_VIEW,
    Permission.FLIGHT_DATA_EDIT,
  ],
};

export interface UserRole {
  userId: string;
  role: Role;
  permissions: Permission[];
}

export interface ResourceAccess {
  resourceId: string;
  resourceType: 'dashboard' | 'chart' | 'dataset';
  userId?: string;
  role?: Role;
  groupId?: string;
  permissions: Permission[];
}

/**
 * Проверка прав доступа
 */
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

/**
 * Получить разрешения пользователя на основе роли
 */
export const getUserPermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Проверка доступа к ресурсу
 */
export const checkResourceAccess = (
  resourceAccess: ResourceAccess,
  userRole: Role,
  userPermissions: Permission[],
  userId?: string,
  userGroups?: string[]
): boolean => {
  // Админ имеет доступ ко всему
  if (userRole === Role.ADMIN) {
    return true;
  }
  
  // Проверка по пользователю
  if (resourceAccess.userId && resourceAccess.userId === userId) {
    return true;
  }
  
  // Проверка по группе
  if (resourceAccess.groupId && userGroups?.includes(resourceAccess.groupId)) {
    return true;
  }
  
  // Проверка по роли
  if (resourceAccess.role && resourceAccess.role === userRole) {
    return true;
  }
  
  // Проверка конкретных разрешений
  const hasRequiredPermission = resourceAccess.permissions.some(permission =>
    hasPermission(userPermissions, permission)
  );
  
  return hasRequiredPermission;
};

const RBACModule: React.FC = () => {
  // Модуль будет интегрирован в DataLens
  return null;
};

export default RBACModule;

