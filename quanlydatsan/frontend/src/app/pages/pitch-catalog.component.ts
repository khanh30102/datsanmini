import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pitch } from '../core/models';
import { PitchService } from '../core/pitch.service';

@Component({
  selector: 'app-pitch-catalog',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <main class="content-page catalog-page">
      <section class="content-hero catalog-hero">
        <div class="content-hero-copy"><div class="eyebrow eyebrow-light"><span class="eyebrow-line"></span> DANH SÁCH SÂN</div><h1>Mặt sân nào<br><em>cũng sẵn sàng.</em></h1><p>Chọn sân hợp đội hình, lọc theo khu vực và tình trạng trống, rồi đặt lịch nhanh trong vài phút.</p></div>
        <div class="content-hero-photo catalog-photo" role="img" aria-label="Sân bóng cỏ xanh sẵn sàng cho trận đấu"><span class="content-photo-label">CHỌN SÂN · LỌC · ĐẶT LỊCH</span></div>
        <div class="content-hero-index">01 <span>/</span> SÂN NHÀ</div>
      </section>
      <section class="content-section">
        <div class="content-section-head"><div><div class="eyebrow"><span class="eyebrow-line"></span> TÌM SÂN CHO ĐỘI CỦA BẠN</div><h2>Sân bóng đang mở</h2></div><span class="content-count">{{ filtered().length }} sân khả dụng</span></div>

        <div class="catalog-toolbar">
          <label class="toolbar-field">
            <span>Tìm kiếm</span>
            <input type="text" [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Tên sân, vị trí, mô tả..." />
          </label>
          <label class="toolbar-field">
            <span>Khu vực</span>
            <select [value]="selectedLocation()" (change)="selectedLocation.set($any($event.target).value)">
              <option value="Tất cả">Tất cả</option>
              @for (location of locations(); track location) { <option [value]="location">{{ location }}</option> }
            </select>
          </label>
          <label class="toolbar-field">
            <span>Loại sân</span>
            <select [value]="selectedType()" (change)="selectedType.set($any($event.target).value)">
              <option value="Tất cả">Tất cả</option>
              @for (type of types; track type) { <option [value]="type">{{ type }}</option> }
            </select>
          </label>
          <label class="toolbar-field">
            <span>Tình trạng</span>
            <select [value]="availabilityMode()" (change)="availabilityMode.set($any($event.target).value)">
              <option value="all">Tất cả</option>
              <option value="available">Còn trống</option>
              <option value="booked">Đã kín</option>
            </select>
          </label>
        </div>

        <div class="content-filters">@for (type of types; track type) { <button class="filter-chip" [class.filter-active]="activeType() === type" (click)="activeType.set(type)">{{ type }}</button> }</div>
        @if (loading()) { <div class="empty-state"><span class="loader"></span><p>Đang tải danh sách sân...</p></div> }
        @else if (error()) { <div class="notice notice-warm">{{ error() }}</div> }
        @else if (filtered().length) {
          <div class="pitch-grid catalog-grid">
            @for (pitch of filtered(); track pitch._id; let index = $index) {
              <article class="pitch-card" [style.animation-delay.ms]="index * 55">
                <a class="pitch-photo" [routerLink]="['/san-bong', pitch._id]" [style.background-image]="'url(' + (pitch.images[0] || fallbackImage) + ')'"><span class="pitch-type">{{ pitch.type }}</span><span class="photo-arrow">↗</span></a>
                <div class="pitch-details"><div class="pitch-location">⌖ {{ pitch.location || 'Hà Nội' }}</div><h3><a [routerLink]="['/san-bong', pitch._id]">{{ pitch.name }}</a></h3><p class="pitch-description">{{ pitch.description || 'Mặt sân được chăm sóc thường xuyên, sẵn sàng cho trận đấu.' }}</p><div class="pitch-card-bottom"><span><strong>{{ pitch.pricePerHour | currency:'VND':'symbol':'1.0-0':'vi' }}</strong> / giờ</span><span class="mini-status" [class.mini-status-open]="pitch.status === 'active'">{{ pitch.status === 'active' ? 'Còn trống' : 'Đã kín' }}</span><a class="round-link" [routerLink]="['/san-bong', pitch._id]" [attr.aria-label]="'Đặt ' + pitch.name">↗</a></div></div>
              </article>
            }
          </div>
        } @else { <div class="empty-state"><span class="empty-mark">SN</span><h3>Chưa có sân thuộc nhóm này</h3><p>Chọn một loại sân khác hoặc thay đổi bộ lọc để tiếp tục.</p></div> }
      </section>
      <section class="content-cta"><div><div class="eyebrow eyebrow-light">ĐÃ CHỌN ĐƯỢC SÂN?</div><h2>Chốt giờ đẹp,<br>gọi đủ đồng đội.</h2></div><a class="button button-lime" routerLink="/cach-dat-san">Xem cách đặt sân <span>↗</span></a></section>
    </main>
  `,
})
export class PitchCatalogComponent implements OnInit {
  private readonly api = inject(PitchService);
  readonly pitches = signal<Pitch[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly selectedLocation = signal('Tất cả');
  readonly selectedType = signal('Tất cả');
  readonly availabilityMode = signal<'all' | 'available' | 'booked'>('all');
  readonly activeType = signal('Tất cả');
  readonly types = ['Tất cả', 'Sân 5', 'Sân 7', 'Sân 11'];
  readonly fallbackImage = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85';
  readonly locations = computed(() => [...new Set(this.pitches().map((pitch) => pitch.location || 'Hà Nội'))]);
  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType() === 'Tất cả' ? this.activeType() : this.selectedType();
    const location = this.selectedLocation();
    const availability = this.availabilityMode();

    return this.pitches().filter((pitch) => {
      const matchesTerm = !term || [pitch.name, pitch.location, pitch.description, pitch.type].join(' ').toLowerCase().includes(term);
      const matchesType = type === 'Tất cả' || pitch.type === type;
      const matchesLocation = location === 'Tất cả' || (pitch.location || 'Hà Nội') === location;
      const matchesAvailability = availability === 'all' || (availability === 'available' ? pitch.status === 'active' : pitch.status !== 'active');
      return matchesTerm && matchesType && matchesLocation && matchesAvailability;
    });
  });

  ngOnInit() {
    this.api.list().subscribe({
      next: (pitches) => { this.pitches.set(pitches); this.loading.set(false); },
      error: () => { this.error.set('Chưa tải được danh sách sân. Vui lòng kiểm tra kết nối máy chủ.'); this.loading.set(false); }
    });
  }
}
