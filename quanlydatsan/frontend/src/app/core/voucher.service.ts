import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Promotion, Voucher } from './models';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/vouchers`;
const PROMOTION_API = `${environment.apiUrl}/promotions`;

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly http = inject(HttpClient);

  list(all = false) {
    return this.http.get<Voucher[]>(all ? `${API}/admin/all` : API);
  }

  create(voucher: Omit<Voucher, '_id' | 'createdAt'>) {
    return this.http.post<Voucher>(API, voucher);
  }

  setActive(id: string, active: boolean) {
    return this.http.put<Voucher>(`${API}/${id}`, { active });
  }

  listPromotions(all = false, date?: string) {
    const url = all ? `${PROMOTION_API}/admin/all` : PROMOTION_API;
    return this.http.get<Promotion[]>(date ? `${url}?date=${encodeURIComponent(date)}` : url);
  }

  createPromotion(promotion: Omit<Promotion, '_id' | 'createdAt'>) {
    return this.http.post<Promotion>(PROMOTION_API, promotion);
  }

  setPromotionActive(id: string, active: boolean) {
    return this.http.put<Promotion>(`${PROMOTION_API}/${id}`, { active });
  }
}
