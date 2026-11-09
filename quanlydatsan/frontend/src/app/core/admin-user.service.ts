import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminAccount, AppUser } from './models';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/admin`;

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<AdminAccount[]>(`${API}/users`);
  }

  setRole(id: string, role: AppUser['role']) {
    return this.http.patch<AdminAccount>(`${API}/users/${id}/role`, { role });
  }
}
