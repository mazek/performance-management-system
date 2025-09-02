// Permission system for role-based access control

export enum Permission {
  // Review Management
  VIEW_OWN_REVIEWS = 'view_own_reviews',
  EDIT_OWN_REVIEWS = 'edit_own_reviews',
  VIEW_TEAM_REVIEWS = 'view_team_reviews',
  EDIT_TEAM_REVIEWS = 'edit_team_reviews',
  VIEW_ALL_REVIEWS = 'view_all_reviews',
  EDIT_ALL_REVIEWS = 'edit_all_reviews',
  DELETE_REVIEWS = 'delete_reviews',
  
  // Employee Management
  VIEW_EMPLOYEES = 'view_employees',
  CREATE_EMPLOYEES = 'create_employees',
  EDIT_EMPLOYEES = 'edit_employees',
  DELETE_EMPLOYEES = 'delete_employees',
  ASSIGN_SUPERVISORS = 'assign_supervisors',
  
  // Role Management
  VIEW_ROLES = 'view_roles',
  ASSIGN_ROLES = 'assign_roles',
  CREATE_ROLES = 'create_roles',
  EDIT_ROLES = 'edit_roles',
  DELETE_ROLES = 'delete_roles',
  
  // Review Period Management
  VIEW_REVIEW_PERIODS = 'view_review_periods',
  CREATE_REVIEW_PERIODS = 'create_review_periods',
  EDIT_REVIEW_PERIODS = 'edit_review_periods',
  OPEN_REVIEW_PERIODS = 'open_review_periods',
  CLOSE_REVIEW_PERIODS = 'close_review_periods',
  ARCHIVE_REVIEW_PERIODS = 'archive_review_periods',
  
  // Reports & Analytics
  VIEW_BASIC_REPORTS = 'view_basic_reports',
  VIEW_DETAILED_REPORTS = 'view_detailed_reports',
  EXPORT_REPORTS = 'export_reports',
  VIEW_ANALYTICS = 'view_analytics',
  
  // System Administration
  VIEW_ADMIN_DASHBOARD = 'view_admin_dashboard',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_INTEGRATIONS = 'manage_integrations',
  MANAGE_AUTH_PROVIDERS = 'manage_auth_providers',
  
  // Department Management
  VIEW_DEPARTMENT_DATA = 'view_department_data',
  MANAGE_DEPARTMENTS = 'manage_departments',
}

// Role definitions with their permissions
export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    // Full system access
    ...Object.values(Permission),
  ],
  
  HR: [
    // Review Management
    Permission.VIEW_ALL_REVIEWS,
    Permission.EDIT_ALL_REVIEWS,
    
    // Employee Management
    Permission.VIEW_EMPLOYEES,
    Permission.CREATE_EMPLOYEES,
    Permission.EDIT_EMPLOYEES,
    Permission.ASSIGN_SUPERVISORS,
    
    // Role Management (limited)
    Permission.VIEW_ROLES,
    Permission.ASSIGN_ROLES, // Can assign predefined roles but not create new ones
    
    // Review Period Management
    Permission.VIEW_REVIEW_PERIODS,
    Permission.CREATE_REVIEW_PERIODS,
    Permission.EDIT_REVIEW_PERIODS,
    Permission.OPEN_REVIEW_PERIODS,
    Permission.CLOSE_REVIEW_PERIODS,
    Permission.ARCHIVE_REVIEW_PERIODS,
    
    // Reports & Analytics
    Permission.VIEW_BASIC_REPORTS,
    Permission.VIEW_DETAILED_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    
    // System Administration (limited)
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.VIEW_DEPARTMENT_DATA,
    Permission.MANAGE_DEPARTMENTS,
  ],
  
  SUPERVISOR: [
    // Review Management
    Permission.VIEW_OWN_REVIEWS,
    Permission.EDIT_OWN_REVIEWS,
    Permission.VIEW_TEAM_REVIEWS,
    Permission.EDIT_TEAM_REVIEWS,
    
    // Employee Management (limited to their team)
    Permission.VIEW_EMPLOYEES, // Only their team
    
    // Reports & Analytics (limited)
    Permission.VIEW_BASIC_REPORTS, // Only for their team
    
    // Review Period Management (view only)
    Permission.VIEW_REVIEW_PERIODS,
  ],
  
  EMPLOYEE: [
    // Review Management (own only)
    Permission.VIEW_OWN_REVIEWS,
    Permission.EDIT_OWN_REVIEWS,
    
    // Very limited access
    Permission.VIEW_REVIEW_PERIODS,
  ],
};

// Helper functions for permission checking
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = RolePermissions[userRole] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Get all permissions for a role
export function getRolePermissions(role: string): Permission[] {
  return RolePermissions[role] || [];
}

// Check if user can access admin area
export function canAccessAdmin(userRole: string): boolean {
  return hasPermission(userRole, Permission.VIEW_ADMIN_DASHBOARD);
}

// Check if user can manage other users
export function canManageUsers(userRole: string): boolean {
  return hasPermission(userRole, Permission.EDIT_EMPLOYEES);
}

// Check if user can view reports
export function canViewReports(userRole: string): boolean {
  return hasAnyPermission(userRole, [
    Permission.VIEW_BASIC_REPORTS,
    Permission.VIEW_DETAILED_REPORTS,
  ]);
}