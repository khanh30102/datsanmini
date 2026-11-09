import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse, AppUser } from './models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;
const USER_KEY = 'pitch-booking-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<AppUser | null>(this.readUser());
  readonly user = this.currentUser.asReadonly();
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API}/auth/login`, credentials).pipe(tap((result) => this.save(result)));
  }

  requestRegistrationOtp(details: { name: string; email: string; password: string; phone: string }) {
    return this.http.post<{ message: string; expiresInSeconds: number }>(`${API}/auth/register/request-otp`, details);
  }

  verifyRegistrationOtp(details: { phone: string; code: string; password: string }) {
    return this.http.post<AuthResponse>(`${API}/auth/register/verify-otp`, details).pipe(tap((result) => this.save(result)));
  }

  token() {
    return localStorage.getItem('pitch-booking-token');
  }

  logout() {
    localStorage.removeItem('pitch-booking-token');
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  private save(result: AuthResponse) {
    localStorage.setItem('pitch-booking-token', result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.currentUser.set(result.user);
  }

  private readUser(): AppUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const value = localStorage.getItem(USER_KEY);
      return value ? JSON.parse(value) as AppUser : null;
    } catch {
      return null;
    }
  }
}