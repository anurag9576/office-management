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

  console.log('AuthGuard checking path:', state.url, 'Role:', role, 'Expected:', expectedRole);

  // If a specific role is required for this route
  if (expectedRole && role !== expectedRole.toLowerCase()) {
    console.warn('Role Mismatch! User is:', role, 'but path requires:', expectedRole);
    // Redirect based on their actual role
    const targetPath = role === 'admin' ? '/dashboard/admin-home' : '/dashboard';
    console.log('Redirecting to:', targetPath);
    router.navigate([targetPath]);
    return false;
  }

  return true;
};
