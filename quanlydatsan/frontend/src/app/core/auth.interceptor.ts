import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = typeof localStorage === 'undefined'
    ? null
    : localStorage.getItem('pitch-booking-token');
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      const isAuthRequest = request.url.includes('/auth/login') || request.url.includes('/auth/register');
      if (token && !isAuthRequest && error instanceof HttpErrorResponse && error.status === 401) {
        const shouldRedirect = auth.user() !== null;
        auth.logout();
        if (shouldRedirect) {
          void router.navigate(['/dang-nhap'], { queryParams: { redirect: router.url } });
        }
      }

      return throwError(() => error);
    })
  );
};