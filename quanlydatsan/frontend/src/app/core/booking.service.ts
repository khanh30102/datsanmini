import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Booking } from './models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  create(details: { pitchId: string; bookingDate: string; startTime: string; endTime: string; voucherCode?: string }) {
    return this.http.post<{ booking: Booking; emailSent: boolean; message: string }>(`${API}/bookings`, details);
  }

  mine() {
    return this.http.get<Booking[]>(`${API}/bookings/my-bookings`);
  }

  all() {
    return this.http.get<Booking[]>(`${API}/bookings/admin/all`);
  }

  updateStatus(id: string, status: Booking['status'], cancellationReason?: string) {
    return this.http.put<Booking>(`${API}/bookings/${id}/status`, { status, cancellationReason });
  }

  updatePaymentStatus(id: string, paymentStatus: 'paid') {
    return this.http.put<Booking>(`${API}/bookings/${id}/payment-status`, { paymentStatus });
  }

  requestPayment(id: string) {
    return this.http.put<{ booking: Booking; message: string }>(`${API}/bookings/${id}/payment-request`, {});
  }

  cancel(id: string) {
    return this.http.put<{ booking: Booking; message: string }>(`${API}/bookings/${id}/cancel`, {});
  }

  reschedule(id: string, details: { bookingDate: string; startTime: string; endTime: string }) {
    return this.http.put<{ booking: Booking; message: string }>(`${API}/bookings/${id}/reschedule`, details);
  }
}