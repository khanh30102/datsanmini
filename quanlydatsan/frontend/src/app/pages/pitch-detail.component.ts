import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BookingService } from '../core/booking.service';
import { Booking, Pitch, PitchReview, Promotion, Voucher } from '../core/models';
import { PitchService } from '../core/pitch.service';
import { ReviewService } from '../core/review.service';
import { VoucherService } from '../core/voucher.service';

@Component({
  selector: 'app-pitch-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './pitch-detail.component.html'
})
export class PitchDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pitchApi = inject(PitchService);
  private readonly bookingApi = inject(BookingService);
  private readonly reviewApi = inject(ReviewService);
  private readonly voucherApi = inject(VoucherService);
  readonly auth = inject(AuthService);
  readonly pitch = signal<Pitch | null>(null);
  readonly unavailable = signal<Booking[]>([]);
  readonly selectedSlot = signal('');
  readonly minimumDate = this.today();
  readonly date = signal(this.minimumDate);
  readonly duration = signal(1);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly voucherCode = signal('');
  readonly voucherMessage = signal('');
  readonly voucherDiscount = signal(0);
  readonly promotion = signal<Promotion | null>(null);
  readonly reviews = signal<PitchReview[]>([]);
  readonly reviewAverage = signal(0);
  readonly reviewCount = signal(0);
  readonly slots = Array.from({ length: 16 }, (_, index) => `${String(index + 6).padStart(2, '0')}:00`);

  readonly basePrice = computed(() => (this.pitch()?.pricePerHour || 0) * this.duration());
  readonly pricingMultiplier = computed(() => {
    const selectedDate = new Date(`${this.date()}T00:00:00`);
    const day = selectedDate.getDay();
    const isWeekend = day === 0 || day === 6;
    const slotHour = Number(this.selectedSlot().slice(0, 2) || '0');
    let multiplier = 1;
    if (isWeekend) multiplier += 0.2;
    if (slotHour >= 17 && slotHour < 22) multiplier += 0.15;
    if (slotHour >= 6 && slotHour < 9) multiplier -= 0.1;
    return Number(multiplier.toFixed(2));
  });
  readonly promotionDiscount = computed(() => {
    const baseTotal = Math.round(this.basePrice() * this.pricingMultiplier());
    return Math.round(baseTotal * (this.promotion()?.value || 0) / 100);
  });
  readonly price = computed(() => Math.max(
    0,
    Math.round(this.basePrice() * this.pricingMultiplier()) - Math.max(this.voucherDiscount(), this.promotionDiscount())
  ));

  ngOnInit() {
    this.loadPromotion(this.date());
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loading.set(true);
      this.pitchApi.get(id).subscribe({
        next: (pitch) => {
          this.pitch.set(pitch);
          this.loading.set(false);
          this.loadAvailability();
          this.reviewApi.forPitch(pitch._id).subscribe({
            next: (result) => { this.reviews.set(result.reviews); this.reviewAverage.set(result.average); this.reviewCount.set(result.count); },
            error: () => this.error.set('Không tải được đánh giá của sân.')
          });
        },
        error: () => { this.error.set('Không tìm thấy sân hoặc máy chủ chưa sẵn sàng.'); this.loading.set(false); }
      });
    });
  }

  private today() {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  loadAvailability() {
    const pitch = this.pitch();
    if (!pitch || !this.date()) return;
    this.selectedSlot.set('');
    this.voucherDiscount.set(0);
    this.voucherCode.set('');
    this.voucherMessage.set('');
    this.pitchApi.availability(pitch._id, this.date()).subscribe({
      next: (bookings) => { this.unavailable.set(bookings); this.error.set(''); },
      error: () => this.error.set('Không tải được lịch sân. Vui lòng thử lại.')
    });
  }

  isUnavailable(slot: string) {
    const start = this.minutes(slot);
    const end = start + this.duration() * 60;
    const now = new Date();
    const isPastToday = this.date() === this.minimumDate
      && start <= now.getHours() * 60 + now.getMinutes();
    return isPastToday
      || this.unavailable().some((booking) => start < this.minutes(booking.endTime) && end > this.minutes(booking.startTime))
      || end > this.minutes('22:00');
  }

  onDateChange(date: string) {
    this.date.set(date);
    this.loadAvailability();
    this.loadPromotion(date);
  }

  private loadPromotion(date: string) {
    this.voucherApi.listPromotions(false, date).subscribe({
      next: (promotions) => this.promotion.set(promotions[0] || null),
      error: () => {
        this.promotion.set(null);
        this.error.set('Không tải được chương trình khuyến mãi. Vui lòng thử lại.');
      }
    });
  }

  applyVoucher() {
    const code = this.voucherCode().trim().toUpperCase();
    if (!code) {
      this.voucherDiscount.set(0);
      this.voucherMessage.set('Vui lòng nhập mã khuyến mãi.');
      return;
    }

    this.voucherApi.list().subscribe({
      next: (vouchers) => {
        const voucher = vouchers.find((item: Voucher) => item.active && item.code.toUpperCase() === code);
        if (!voucher) {
          this.voucherDiscount.set(0);
          this.voucherMessage.set('Mã khuyến mãi không hợp lệ, đã hết hiệu lực hoặc hết lượt sử dụng.');
          return;
        }
        const rawTotal = Math.round(this.basePrice() * this.pricingMultiplier());
        let discount = 0;
        if (voucher.type === 'percentage') discount = Math.round(rawTotal * (voucher.value / 100));
        if (voucher.type === 'fixed') discount = Math.min(rawTotal, voucher.value);
        if (voucher.type === 'offpeak') {
          const hour = Number(this.selectedSlot().slice(0, 2) || '0');
          if (!(hour >= 9 && hour < 17)) {
            this.voucherDiscount.set(0);
            this.voucherMessage.set('Mã này không áp dụng cho khung giờ đã chọn.');
            return;
          }
          discount = Math.round(rawTotal * (voucher.value / 100));
        }
        this.voucherDiscount.set(discount);
        const promotionDiscount = this.promotionDiscount();
        if (promotionDiscount > discount && this.promotion()) {
          this.voucherMessage.set(`Đã nhận mã ${voucher.code}; chương trình ${this.promotion()!.name} đang áp dụng mức giảm cao hơn ${promotionDiscount.toLocaleString('vi-VN')}₫.`);
        } else {
          this.voucherMessage.set(`Áp dụng mã ${voucher.code}: giảm ${discount.toLocaleString('vi-VN')}₫.`);
        }
      },
      error: () => this.voucherMessage.set('Không kiểm tra được mã khuyến mãi. Vui lòng thử lại.')
    });
  }

  selectSlot(slot: string) {
    if (slot === this.selectedSlot()) return;
    this.selectedSlot.set(slot);
    this.clearVoucher();
  }

  setDuration(duration: number) {
    this.duration.set(duration);
    this.selectedSlot.set('');
    this.clearVoucher();
  }

  setVoucherCode(code: string) {
    this.voucherCode.set(code);
    this.voucherDiscount.set(0);
    this.voucherMessage.set('');
  }

  private clearVoucher() {
    this.voucherCode.set('');
    this.voucherDiscount.set(0);
    this.voucherMessage.set('');
  }

  confirmBooking() {
    const pitch = this.pitch();
    const slot = this.selectedSlot();
    if (!pitch || !slot) return;
    if (!this.auth.user()) { this.error.set('Đăng nhập để xác nhận đặt sân.'); return; }
    if (this.isUnavailable(slot)) { this.error.set('Khung giờ vừa được đặt. Hãy chọn giờ khác.'); this.loadAvailability(); return; }
    const end = this.minutes(slot) + this.duration() * 60;
    const endTime = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
    this.busy.set(true);
    this.error.set('');
    this.bookingApi.create({
      pitchId: pitch._id,
      bookingDate: this.date(),
      startTime: slot,
      endTime,
      voucherCode: this.voucherCode().trim()
    }).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.notice.set(`${result.message} Tiền cọc cần thanh toán: ${result.booking.depositAmount.toLocaleString('vi-VN')}₫. ${result.emailSent ? 'Email xác nhận đã được gửi.' : 'Báo đã chuyển cọc trong lịch đặt để admin xác nhận.'}`);
        this.loadAvailability();
      },
      error: (response) => {
        this.busy.set(false);
        this.error.set(response.error?.message || 'Không thể đặt sân lúc này.');
        this.loadAvailability();
      }
    });
  }

  private minutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  reviewAuthor(review: PitchReview) {
    return typeof review.userId === 'string' ? 'Khách hàng' : review.userId.name;
  }

  reviewStars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
