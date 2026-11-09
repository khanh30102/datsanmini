import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminStatus {
  customerEmailEnabled: boolean;
  adminPaymentEmailEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminStatusService {
  private readonly http = inject(HttpClient);

  get() {
    return this.http.get<AdminStatus>(`${environment.apiUrl}/admin/status`);
  }
}
