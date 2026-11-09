import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.setItem('pitch-booking-token', 'expired-token');
    localStorage.setItem('pitch-booking-user', JSON.stringify({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin'
    }));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
  });

  afterEach(() => {
    localStorage.removeItem('pitch-booking-token');
    localStorage.removeItem('pitch-booking-user');
  });

  it('clears an expired session and redirects to login after a protected API returns 401', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let responseError: unknown;

    TestBed.inject(HttpClient).get('/api/admin/status').subscribe({
      error: (error) => { responseError = error; }
    });

    const request = TestBed.inject(HttpTestingController).expectOne('/api/admin/status');
    expect(request.request.headers.get('Authorization')).toBe('Bearer expired-token');
    request.flush({ message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401, statusText: 'Unauthorized' });

    expect(responseError).toBeInstanceOf(HttpErrorResponse);
    expect(auth.user()).toBeNull();
    expect(localStorage.getItem('pitch-booking-token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/dang-nhap'], { queryParams: { redirect: router.url } });
  });
});
