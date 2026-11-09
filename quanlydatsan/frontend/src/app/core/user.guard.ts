import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const userGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user() ? true : inject(Router).createUrlTree(['/dang-nhap'], {
    queryParams: { redirect: '/lich-dat' }
  });
};