import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userJson = localStorage.getItem('currentUser');

  if (!userJson) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userJson);
  const role = (user.role || '').toLowerCase();
  const expectedRole = route.data['role'];
  const requiredPermission = route.data['permission'];

  console.log('AuthGuard checking path:', state.url, 'Role:', role, 'Expected:', expectedRole, 'Permission:', requiredPermission);

  // Admins have bypass for everything
  if (role === 'admin') {
    return true;
  }

  // If a specific permission is required
  if (requiredPermission) {
    const permissionsJson = localStorage.getItem('userPermissions');
    const permissions: string[] = permissionsJson ? JSON.parse(permissionsJson) : [];
    
    if (permissions.includes(requiredPermission)) {
      return true;
    }
  }

  // Fallback to role check if no specific permission matched or if role is explicitly required
  if (expectedRole && role !== expectedRole.toLowerCase()) {
    console.warn('Access Denied! User role:', role, 'Path requires role:', expectedRole, 'or permission:', requiredPermission);
    // Redirect based on their actual role
    const targetPath = role === 'admin' ? '/dashboard/admin-home' : '/dashboard';
    router.navigate([targetPath]);
    return false;
  }

  return true;
};
