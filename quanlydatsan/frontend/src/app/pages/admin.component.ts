import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AdminUserService } from '../core/admin-user.service';
import { AuthService } from '../core/auth.service';
import { BookingService } from '../core/booking.service';
import { AdminAccount, AppUser, Booking, Pitch, Promotion, Voucher } from '../core/models';
import { PitchService } from '../core/pitch.service';
import { VoucherService } from '../core/voucher.service';
import { AdminStatus, AdminStatusService } from '../core/admin-status.service';

type AdminTab = 'pitches' | 'bookings' | 'pending' | 'dashboard' | 'vouchers' | 'accounts';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  private readonly pitchesApi = inject(PitchService);
  private readonly bookingsApi = inject(BookingService);
  private readonly vouchersApi = inject(VoucherService);
  private readonly usersApi = inject(AdminUserService);
  readonly auth = inject(AuthService);
  private readonly adminStatusApi = inject(AdminStatusService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly tab = signal<AdminTab>('dashboard');
  readonly pitches = signal<Pitch[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly vouchers = signal<Voucher[]>([]);
  readonly accounts = signal<AdminAccount[]>([]);
  readonly accountsLoading = signal(false);
  readonly accountSearch = signal('');
  readonly accountSavingId = signal<string | null>(null);
  readonly promotions = signal<Promotion[]>([]);
  readonly adminStatus = signal<AdminStatus | null>(null);
  readonly pendingNoticeOpen = signal(false);
  readonly bookingSearch = signal('');
  readonly bookingStatusFilter = signal<'all' | Booking['status']>('all');
  readonly bookingPitchTypeFilter = signal('all');
  readonly bookingDateFrom = signal('');
  readonly bookingDateTo = signal('');
  readonly selectedBooking = signal<Booking | null>(null);
  readonly cancellationBooking = signal<Booking | null>(null);
  readonly cancellationReason = signal('');
  readonly cancellationError = signal('');
  readonly pendingBookings = computed(() => this.bookings()
    .filter((booking) => booking.status === 'pending')
    .sort((a, b) => `${a.bookingDate} ${a.startTime}`.localeCompare(`${b.bookingDate} ${b.startTime}`)));
  readonly dashboardStats = computed(() => {
    const confirmed = this.bookings().filter((booking) => booking.status === 'confirmed');
    const totalRevenue = this.bookings()
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.depositAmount, 0);
    const pendingBookings = this.bookings().filter((booking) => booking.status === 'pending').length;
    const pendingPayments = this.bookings().filter((booking) => booking.paymentStatus === 'payment_requested').length;
    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const value = this.bookings().filter((booking) => booking.bookingDate === key && booking.paymentStatus === 'paid')
        .reduce((sum, booking) => sum + booking.depositAmount, 0);
      return { label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), value };
    });
    const favoriteSlots = Array.from({ length: 16 }, (_, index) => {
      const hour = String(index + 6).padStart(2, '0') + ':00';
      const total = confirmed.filter((booking) => booking.startTime.startsWith(String(index + 6).padStart(2, '0'))).length;
      return { hour, total };
    }).filter((slot) => slot.total > 0).sort((a, b) => b.total - a.total);
    const highestRevenue = Math.max(...dailyRevenue.map((day) => day.value), 1);
    const weekKeys = new Set(Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }));
    const bookedHours = this.bookings().filter((booking) => booking.status !== 'cancelled' && weekKeys.has(booking.bookingDate))
      .reduce((sum, booking) => {
        const [startHour, startMinute] = booking.startTime.split(':').map(Number);
        const [endHour, endMinute] = booking.endTime.split(':').map(Number);
        return sum + (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
      }, 0);
    const activePitchCount = this.pitches().filter((pitch) => pitch.status === 'active').length;
    const utilization = activePitchCount
      ? Math.min(100, Math.round(bookedHours / (activePitchCount * 16 * 7) * 100))
      : 0;
    const pitchTotals = new Map<string, { name: string; count: number }>();
    for (const booking of confirmed) {
      const pitchName = typeof booking.pitchId === 'string' || !booking.pitchId ? 'Sân không xác định' : booking.pitchId.name;
      const current = pitchTotals.get(pitchName) || { name: pitchName, count: 0 };
      current.count += 1;
      pitchTotals.set(pitchName, current);
    }
    const popularPitch = [...pitchTotals.values()].sort((a, b) => b.count - a.count)[0] || { name: 'Chưa có', count: 0 };
    return { totalRevenue, pendingBookings, pendingPayments, dailyRevenue, favoriteSlots, highestRevenue, utilization, popularPitch };
  });
  readonly bookingPitchTypes = computed(() => [...new Set([
    'Sân 5',
    'Sân 7',
    'Sân 11',
    ...this.bookings().map((booking) => this.pitchType(booking))
  ])].sort((a, b) => a.localeCompare(b, 'vi')));
  readonly filteredBookings = computed(() => {
    const query = this.bookingSearch().trim().toLocaleLowerCase('vi');
    const status = this.bookingStatusFilter();
    const pitchType = this.bookingPitchTypeFilter();
    const from = this.bookingDateFrom();
    const to = this.bookingDateTo();
    return this.bookings().filter((booking) => {
      const customer = this.customerName(booking).toLocaleLowerCase('vi');
      const phone = this.customerPhone(booking).toLocaleLowerCase('vi');
      const code = this.bookingCode(booking).toLocaleLowerCase('vi');
      const matchesSearch = !query || code.includes(query) || booking._id.toLocaleLowerCase('vi').includes(query)
        || customer.includes(query) || phone.includes(query);
      const matchesStatus = status === 'all' || booking.status === status;
      const matchesPitch = pitchType === 'all' || this.pitchType(booking) === pitchType;
      return matchesSearch && matchesStatus && matchesPitch
        && (!from || booking.bookingDate >= from) && (!to || booking.bookingDate <= to);
    }).sort((a, b) => `${b.bookingDate} ${b.startTime}`.localeCompare(`${a.bookingDate} ${a.startTime}`));
  });
  readonly filteredAccounts = computed(() => {
    const query = this.accountSearch().trim().toLocaleLowerCase('vi');
    return this.accounts().filter((account) => !query
      || account.name.toLocaleLowerCase('vi').includes(query)
      || account.email.toLocaleLowerCase('vi').includes(query)
      || account.phone?.toLocaleLowerCase('vi').includes(query) === true);
  });
  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly error = signal('');
  readonly selectedImages = signal<File[]>([]);
  readonly imagePreviews = signal<{ name: string; url: string }[]>([]);
  readonly saving = signal(false);
  private bookingsLoading = false;
  readonly voucherForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    value: [10, [Validators.required, Validators.min(1)]],
    type: ['percentage', Validators.required],
    maxUses: ['', Validators.pattern(/^\s*$|^[1-9]\d*$/)],
    active: [true]
  });
  readonly promotionForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    value: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    active: [true]
  });
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    type: ['Sân 5', Validators.required],
    pricePerHour: [500000, [Validators.required, Validators.min(0)]],
    location: [''],
    images: [''],
    description: ['']
  });

  ngOnInit() {
    this.load();
    interval(15000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadBookings());
  }

  load() {
    this.pitchesApi.list(true).subscribe({ next: (items) => this.pitches.set(items), error: () => this.error.set('Không tải được danh sách sân.') });
    this.loadBookings();
    this.vouchersApi.list(true).subscribe({ next: (items) => this.vouchers.set(items), error: () => this.error.set('Không tải được voucher.') });
    this.vouchersApi.listPromotions(true).subscribe({ next: (items) => this.promotions.set(items), error: () => this.error.set('Không tải được chương trình khuyến mãi.') });
    this.loadAccounts();
    this.adminStatusApi.get().subscribe({
      next: (status) => this.adminStatus.set(status),
      error: () => this.error.set('Không tải được trạng thái cấu hình email.')
    });
  }

  loadAccounts() {
    this.accountsLoading.set(true);
    this.usersApi.list().subscribe({
      next: (items) => {
        this.accounts.set(items);
        this.accountsLoading.set(false);
      },
      error: (response) => {
        this.accountsLoading.set(false);
        this.error.set(response.error?.message || 'Không tải được danh sách tài khoản.');
      }
    });
  }

  changeAccountRole(account: AdminAccount) {
    if (account.id === this.auth.user()?.id || this.accountSavingId()) return;
    const role: AppUser['role'] = account.role === 'admin' ? 'user' : 'admin';
    const confirmation = role === 'admin'
      ? `Bạn có chắc muốn cấp quyền quản trị cho ${account.name}?`
      : `Bạn có chắc muốn hạ quyền quản trị của ${account.name}?`;
    if (!window.confirm(confirmation)) return;

    this.accountSavingId.set(account.id);
    this.usersApi.setRole(account.id, role).subscribe({
      next: (updated) => {
        this.accounts.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.accountSavingId.set(null);
      },
      error: (response) => {
        this.accountSavingId.set(null);
        this.error.set(response.error?.message || 'Không thể cập nhật vai trò tài khoản.');
      }
    });
  }

  private loadBookings() {
    if (this.bookingsLoading) return;
    this.bookingsLoading = true;
    this.bookingsApi.all().subscribe({
      next: (items) => {
        const knownPendingIds = new Set(this.bookings()
          .filter((booking) => booking.status === 'pending')
          .map((booking) => booking._id));
        const hasNewPending = items.some((booking) => booking.status === 'pending' && !knownPendingIds.has(booking._id));
        this.bookings.set(items);
        if (hasNewPending) this.pendingNoticeOpen.set(true);
        if (!items.some((booking) => booking.status === 'pending')) this.pendingNoticeOpen.set(false);
        this.bookingsLoading = false;
      },
      error: () => {
        this.bookingsLoading = false;
        this.error.set('Không tải được đơn đặt sân.');
      }
    });
  }

  closePendingNotice() {
    this.pendingNoticeOpen.set(false);
  }

  bookingCode(booking: Booking) {
    return `SP-${booking._id.toUpperCase()}`;
  }

  customerPhone(booking: Booking) {
    return typeof booking.userId === 'string' || !booking.userId ? 'Chưa cập nhật' : booking.userId.phone || 'Chưa cập nhật';
  }

  pitchType(booking: Booking) {
    return typeof booking.pitchId === 'string' || !booking.pitchId ? 'Không xác định' : booking.pitchId.type;
  }

  openBookingDetails(booking: Booking) {
    this.selectedBooking.set(booking);
  }

  closeBookingDetails() {
    this.selectedBooking.set(null);
  }

  openCancellationDialog(booking: Booking) {
    this.error.set('');
    this.closePendingNotice();
    this.cancellationBooking.set(booking);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  closeCancellationDialog() {
    this.cancellationBooking.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  setCancellationReason(reason: string) {
    this.cancellationReason.set(reason);
    this.cancellationError.set('');
  }

  confirmCancellation() {
    const booking = this.cancellationBooking();
    const reason = this.cancellationReason().trim();
    if (!booking) return;
    if (!reason) {
      this.cancellationError.set('Vui lòng nhập lý do hủy đơn.');
      return;
    }
    if (reason.length > 500) {
      this.cancellationError.set('Lý do hủy không được vượt quá 500 ký tự.');
      return;
    }
    this.bookingsApi.updateStatus(booking._id, 'cancelled', reason).subscribe({
      next: (updated) => {
        this.mergeBookingUpdate(updated);
        this.closeCancellationDialog();
        this.loadBookings();
      },
      error: (response) => this.cancellationError.set(response.error?.message || 'Không thể hủy đơn.')
    });
  }

  exportBookingInvoice(booking: Booking) {
    const popup = window.open('', '_blank', 'width=800,height=900');
    if (!popup) {
      this.error.set('Trình duyệt đã chặn cửa sổ hóa đơn. Hãy cho phép popup rồi thử lại.');
      return;
    }
    const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character] || character);
    const date = new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString('vi-VN');
    const invoice = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${escape(this.bookingCode(booking))}</title>
      <style>body{font:15px Arial,sans-serif;color:#19251e;max-width:720px;margin:48px auto;padding:0 24px}h1{margin-bottom:4px}small{color:#68736a}.rule{border:0;border-top:1px solid #dfe4db;margin:24px 0}table{width:100%;border-collapse:collapse}td{padding:12px 0;border-bottom:1px solid #e8ebe5}td:last-child{text-align:right;font-weight:700}.total{font-size:20px}@media print{body{margin:0}}</style></head>
      <body><h1>HÓA ĐƠN ĐẶT SÂN</h1><small>${escape(this.bookingCode(booking))}</small><hr class="rule">
      <table><tr><td>Khách hàng</td><td>${escape(this.customerName(booking))}</td></tr><tr><td>Số điện thoại</td><td>${escape(this.customerPhone(booking))}</td></tr>
      <tr><td>Sân bóng</td><td>${escape(this.pitchName(booking))} · ${escape(this.pitchType(booking))}</td></tr><tr><td>Ngày thi đấu</td><td>${escape(date)}</td></tr>
      <tr><td>Thời gian</td><td>${escape(booking.startTime)} – ${escape(booking.endTime)}</td></tr><tr><td>Trạng thái</td><td>${escape(this.statusLabel(booking.status))}</td></tr>
      <tr><td>Tổng tiền</td><td class="total">${booking.totalPrice.toLocaleString('vi-VN')} ₫</td></tr><tr><td>Tiền cọc</td><td>${booking.depositAmount.toLocaleString('vi-VN')} ₫</td></tr></table>
      <hr class="rule"><small>Hóa đơn được xuất từ hệ thống quản lý sân nhà.</small><script>window.onload=()=>window.print()</script></body></html>`;
    popup.document.open();
    popup.document.write(invoice);
    popup.document.close();
  }

  saveVoucher() {
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      return;
    }

    const value = this.voucherForm.getRawValue();
    const voucher = {
      code: value.code.trim().toUpperCase(),
      description: value.description.trim(),
      value: Number(value.value),
      type: value.type as Voucher['type'],
      maxUses: value.maxUses.trim() ? Number(value.maxUses) : null,
      usedCount: 0,
      active: value.active
    };

    this.vouchersApi.create(voucher).subscribe({
      next: (created) => {
        this.vouchers.update((items) => [created, ...items]);
        this.voucherForm.reset({ code: '', description: '', value: 10, type: 'percentage', maxUses: '', active: true });
      },
      error: (response) => this.error.set(response.error?.message || 'Không thể tạo voucher.')
    });
  }

  toggleVoucher(voucher: Voucher) {
    this.vouchersApi.setActive(voucher._id, !voucher.active).subscribe({
      next: (updated) => this.vouchers.update((items) => items.map((item) => item._id === updated._id ? updated : item)),
      error: (response) => this.error.set(response.error?.message || 'Không thể cập nhật voucher.')
    });
  }

  voucherRemaining(voucher: Voucher) {
    return voucher.maxUses === null ? null : Math.max(0, voucher.maxUses - voucher.usedCount);
  }

  savePromotion() {
    if (this.promotionForm.invalid) {
      this.promotionForm.markAllAsTouched();
      return;
    }
    const value = this.promotionForm.getRawValue();
    if (value.endDate < value.startDate) {
      this.error.set('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
      return;
    }
    this.error.set('');
    this.vouchersApi.createPromotion({
      name: value.name.trim(),
      value: Number(value.value),
      startDate: value.startDate,
      endDate: value.endDate,
      active: value.active
    }).subscribe({
      next: (created) => {
        this.promotions.update((items) => [created, ...items]);
        this.promotionForm.reset({ name: '', value: 10, startDate: '', endDate: '', active: true });
      },
      error: (response) => this.error.set(response.error?.message || 'Không thể tạo chương trình khuyến mãi.')
    });
  }

  togglePromotion(promotion: Promotion) {
    this.vouchersApi.setPromotionActive(promotion._id, !promotion.active).subscribe({
      next: (updated) => this.promotions.update((items) => items.map((item) => item._id === updated._id ? updated : item)),
      error: (response) => this.error.set(response.error?.message || 'Không thể cập nhật chương trình khuyến mãi.')
    });
  }

  savePitch() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const save = (uploadedImages: string[]) => {
      const pitch: Partial<Pitch> = {
        ...value,
        images: [...value.images.split('\n').map((image) => image.trim()).filter(Boolean), ...uploadedImages]
      };
      const request = editingId ? this.pitchesApi.update(editingId, pitch) : this.pitchesApi.create(pitch);
      request.subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (response) => { this.saving.set(false); this.error.set(response.error?.message || 'Không thể lưu sân.'); }
      });
    };

    this.saving.set(true);
    const files = this.selectedImages();
    if (!files.length) { save([]); return; }
    this.pitchesApi.uploadImages(files).subscribe({
      next: ({ images }) => save(images),
      error: (response) => { this.saving.set(false); this.error.set(response.error?.message || 'Không tải được ảnh lên.'); }
    });
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = [...this.selectedImages(), ...Array.from(input.files || [])];
    input.value = '';
    if (files.length > 5) {
      this.error.set('Chỉ được chọn tối đa 5 ảnh mỗi lần.');
      return;
    }
    this.error.set('');
    this.clearImagePreviews();
    this.selectedImages.set(files);
    this.imagePreviews.set(files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })));
  }

  clearSelectedImages() {
    this.clearImagePreviews();
    this.selectedImages.set([]);
  }

  editPitch(pitch: Pitch) {
    this.editingId.set(pitch._id);
    this.form.patchValue({
      name: pitch.name,
      type: pitch.type,
      pricePerHour: pitch.pricePerHour,
      location: pitch.location,
      images: pitch.images.join('\n'),
      description: pitch.description
    });
    this.modalOpen.set(true);
  }

  deactivatePitch(pitch: Pitch) {
    if (!window.confirm(`Ngừng kinh doanh ${pitch.name}?`)) return;
    this.pitchesApi.remove(pitch._id).subscribe({
      next: () => this.load(),
      error: (response) => this.error.set(response.error?.message || 'Không thể ngừng sân.')
    });
  }

  activatePitch(pitch: Pitch) {
    this.pitchesApi.update(pitch._id, { status: 'active' }).subscribe({
      next: () => this.load(),
      error: (response) => this.error.set(response.error?.message || 'Không thể mở lại sân.')
    });
  }

  closeModal() {
    this.modalOpen.set(false);
    this.editingId.set(null);
    this.clearSelectedImages();
    this.form.reset({ name: '', type: 'Sân 5', pricePerHour: 500000, location: '', images: '', description: '' });
  }

  private clearImagePreviews() {
    this.imagePreviews().forEach((image) => URL.revokeObjectURL(image.url));
    this.imagePreviews.set([]);
  }

  setStatus(booking: Booking, status: Booking['status']) {
    if (status === 'cancelled') {
      this.openCancellationDialog(booking);
      return;
    }
    this.bookingsApi.updateStatus(booking._id, status).subscribe({
      next: (updated) => {
        this.mergeBookingUpdate(updated);
        this.loadBookings();
      },
      error: (response) => this.error.set(response.error?.message || 'Không thể cập nhật đơn.')
    });
  }

  setPaymentStatus(booking: Booking, paymentStatus: 'paid') {
    this.bookingsApi.updatePaymentStatus(booking._id, paymentStatus).subscribe({
      next: (updated) => {
        this.mergeBookingUpdate(updated);
        this.loadBookings();
      },
      error: (response) => this.error.set(response.error?.message || 'Không thể cập nhật tiền cọc.')
    });
  }

  private mergeBookingUpdate(updated: Booking) {
    this.bookings.update((items) => items.map((item) => item._id === updated._id
      ? { ...item, status: updated.status, paymentStatus: updated.paymentStatus, cancellationReason: updated.cancellationReason }
      : item));
  }

  pitchName(booking: Booking) {
    return typeof booking.pitchId === 'string' || !booking.pitchId ? 'Sân đã ngừng hoạt động' : booking.pitchId.name;
  }

  customerName(booking: Booking) {
    return typeof booking.userId === 'string' || !booking.userId ? 'Khách hàng' : booking.userId.name;
  }

  statusLabel(status: Booking['status']) {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'confirmed':
        return 'Đã duyệt';
      default:
        return 'Đã hủy';
    }
  }

  paymentLabel(status: Booking['paymentStatus']) {
    return status === 'unpaid' ? 'Chưa đặt cọc'
      : status === 'payment_requested' ? 'Chờ xác nhận cọc'
        : status === 'paid' ? 'Đã nhận cọc' : 'Đã hoàn cọc';
  }
}
