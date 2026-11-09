import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingService } from '../core/booking.service';
import { ReviewService } from '../core/review.service';
import { Booking } from '../core/models';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <main class="my-bookings-page">
      <div class="eyebrow"><span class="eyebrow-line"></span> HỒ SƠ CỦA BẠN</div>
      <div class="section-heading"><div><h1>Lịch đặt <em>sân bóng</em></h1><p class="auth-intro">Theo dõi lịch, tiền cọc và đánh giá trận đấu.</p></div><a class="button button-dark" routerLink="/">Tìm sân <span>↗</span></a></div>
      @if (error()) { <div class="notice notice-error">{{ error() }}</div> }
      @if (notice()) { <div class="notice notice-success">{{ notice() }}</div> }
      @if (loading()) { <div class="empty-state"><span class="loader"></span><p>Đang tải lịch đặt...</p></div> }
      @else if (bookings().length) {
        <div class="my-booking-list">
          @for (booking of bookings(); track booking._id) {
            <article class="my-booking-row">
              <div class="booking-date-tile"><span>{{ booking.bookingDate | date:'MMM':'':'vi' }}</span><b>{{ booking.bookingDate | date:'dd' }}</b></div>
              <div class="my-booking-main">
                <span class="eyebrow">{{ booking.bookingDate | date:'EEEE, dd/MM/yyyy':'':'vi' }}</span>
                <h2>{{ pitchName(booking) }}</h2>
                <p>{{ booking.startTime }} — {{ booking.endTime }}</p>
                <small>Đặt cọc: {{ booking.depositAmount | currency:'VND':'symbol':'1.0-0':'vi' }} · {{ paymentLabel(booking.paymentStatus) }}</small>
              </div>
              <div class="my-booking-total"><span>{{ booking.totalPrice | currency:'VND':'symbol':'1.0-0':'vi' }}</span><small [class.status-text-pending]="booking.status === 'pending'">{{ statusLabel(booking.status) }}</small></div>
              @if (booking.status !== 'cancelled' && (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'refunded')) {
                <button class="approve-action" (click)="requestPayment(booking)">{{ booking.paymentStatus === 'refunded' ? 'Báo chuyển cọc mới' : 'Đã chuyển cọc' }}</button>
              }
              @if (canModify(booking)) {
                <div class="booking-item-actions">
                  <button class="approve-action" (click)="beginReschedule(booking)">Đổi lịch</button>
                  <button class="cancel-action" (click)="cancel(booking)">Hủy lịch</button>
                </div>
              }
              @if (reschedulingId() === booking._id) {
                <form class="booking-reschedule-form" (ngSubmit)="reschedule(booking)">
                  <label class="field-label">Ngày mới<input type="date" name="rescheduleDate" [(ngModel)]="rescheduleDate" [min]="minimumDate"></label>
                  <label class="field-label">Bắt đầu<input type="time" name="rescheduleStart" [(ngModel)]="rescheduleStart"></label>
                  <label class="field-label">Kết thúc<input type="time" name="rescheduleEnd" [(ngModel)]="rescheduleEnd"></label>
                  <button class="button button-dark" type="submit" [disabled]="busy()">Lưu lịch mới</button>
                  <button class="button button-quiet" type="button" (click)="reschedulingId.set(null)">Đóng</button>
                </form>
              }
              @if (canReview(booking) && !booking.reviewSubmitted) {
                @if (reviewingId() !== booking._id) {
                  <button class="approve-action" (click)="reviewingId.set(booking._id)">Đánh giá sân</button>
                } @else {
                  <form class="booking-review-form" (ngSubmit)="submitReview(booking)">
                    <label class="field-label">Số sao<select name="rating" [(ngModel)]="reviewRating"><option [ngValue]="5">5 sao</option><option [ngValue]="4">4 sao</option><option [ngValue]="3">3 sao</option><option [ngValue]="2">2 sao</option><option [ngValue]="1">1 sao</option></select></label>
                    <label class="field-label">Nhận xét<textarea name="comment" [(ngModel)]="reviewComment" maxlength="1000"></textarea></label>
                    <button class="button button-dark" type="submit" [disabled]="busy()">Gửi đánh giá</button>
                  </form>
                }
              } @else if (booking.reviewSubmitted) { <small>Đã đánh giá sân</small> }
            </article>
          }
        </div>
      } @else { <div class="empty-state"><span class="empty-mark">SN</span><h3>Chưa có trận nào trong lịch</h3><p>Chọn một sân và đặt khung giờ phù hợp để bắt đầu.</p><a class="text-link" routerLink="/">Khám phá sân bóng ↗</a></div> }
    </main>
  `
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingApi = inject(BookingService);
  private readonly reviewApi = inject(ReviewService);
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly reschedulingId = signal<string | null>(null);
  readonly reviewingId = signal<string | null>(null);
  readonly minimumDate = this.today();
  rescheduleDate = this.minimumDate;
  rescheduleStart = '18:00';
  rescheduleEnd = '19:00';
  reviewRating = 5;
  reviewComment = '';

  ngOnInit() { this.load(); }

  private load() {
    this.bookingApi.mine().subscribe({
      next: (bookings) => { this.bookings.set(bookings); this.loading.set(false); },
      error: (response) => { this.error.set(response.error?.message || 'Không tải được lịch đặt.'); this.loading.set(false); }
    });
  }

  private today() {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  pitchName(booking: Booking) {
    return typeof booking.pitchId === 'string' || !booking.pitchId ? 'Sân bóng' : booking.pitchId.name;
  }

  statusLabel(status: Booking['status']) {
    return status === 'pending' ? 'Chờ xác nhận' : status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy';
  }

  paymentLabel(status: Booking['paymentStatus']) {
    return status === 'unpaid' ? 'Chưa đặt cọc'
      : status === 'payment_requested' ? 'Chờ admin xác nhận'
        : status === 'paid' ? 'Đã nhận cọc' : 'Đã hoàn cọc';
  }

  canModify(booking: Booking) {
    return booking.status !== 'cancelled'
      && new Date(`${booking.bookingDate}T${booking.startTime}:00`).getTime() - Date.now() >= 12 * 60 * 60 * 1000;
  }

  canReview(booking: Booking) {
    return booking.status === 'confirmed'
      && new Date(`${booking.bookingDate}T${booking.endTime}:00`).getTime() <= Date.now();
  }

  requestPayment(booking: Booking) {
    this.busy.set(true);
    this.bookingApi.requestPayment(booking._id).subscribe({
      next: ({ message }) => { this.notice.set(message); this.error.set(''); this.busy.set(false); this.load(); },
      error: (response) => { this.error.set(response.error?.message || 'Không thể gửi yêu cầu đặt cọc.'); this.busy.set(false); }
    });
  }

  cancel(booking: Booking) {
    if (!window.confirm('Bạn chắc chắn muốn hủy lịch đặt sân này?')) return;
    this.busy.set(true);
    this.bookingApi.cancel(booking._id).subscribe({
      next: ({ message }) => { this.notice.set(message); this.error.set(''); this.busy.set(false); this.load(); },
      error: (response) => { this.error.set(response.error?.message || 'Không thể hủy lịch.'); this.busy.set(false); }
    });
  }

  beginReschedule(booking: Booking) {
    this.rescheduleDate = booking.bookingDate;
    this.rescheduleStart = booking.startTime;
    this.rescheduleEnd = booking.endTime;
    this.reschedulingId.set(booking._id);
  }

  reschedule(booking: Booking) {
    this.busy.set(true);
    this.bookingApi.reschedule(booking._id, {
      bookingDate: this.rescheduleDate,
      startTime: this.rescheduleStart,
      endTime: this.rescheduleEnd
    }).subscribe({
      next: ({ message }) => { this.notice.set(message); this.error.set(''); this.reschedulingId.set(null); this.busy.set(false); this.load(); },
      error: (response) => { this.error.set(response.error?.message || 'Không thể đổi lịch.'); this.busy.set(false); }
    });
  }

  submitReview(booking: Booking) {
    const pitchId = typeof booking.pitchId === 'string' ? booking.pitchId : booking.pitchId._id;
    if (!pitchId) return;
    this.busy.set(true);
    this.reviewApi.create({ bookingId: booking._id, rating: this.reviewRating, comment: this.reviewComment }).subscribe({
      next: () => {
        this.notice.set('Cảm ơn bạn đã đánh giá sân.');
        this.reviewingId.set(null);
        this.reviewComment = '';
        this.reviewRating = 5;
        this.busy.set(false);
        this.load();
      },
      error: (response) => { this.error.set(response.error?.message || 'Không thể gửi đánh giá.'); this.busy.set(false); }
    });
  }
}
