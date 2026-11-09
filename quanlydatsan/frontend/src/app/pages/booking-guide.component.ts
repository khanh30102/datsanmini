import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-booking-guide',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="content-page guide-page">
      <section class="content-hero guide-hero">
        <div class="content-hero-copy"><div class="eyebrow eyebrow-light"><span class="eyebrow-line"></span> HƯỚNG DẪN ĐẶT SÂN</div><h1>Ít thao tác.<br><em>Nhiều bóng đá.</em></h1><p>Từ lúc chọn sân đến khi xác nhận lịch chỉ gói gọn trong vài bước minh bạch.</p><a class="button button-lime" routerLink="/san-bong">Tìm sân ngay <span>↗</span></a></div>
        <div class="content-hero-photo guide-photo" role="img" aria-label="Trận đấu bóng đá buổi chiều"><span class="guide-photo-note">ĐỘI ĐÃ ĐỦ.<br>SÂN ĐÃ SẴN.</span></div>
        <div class="content-hero-index">02 <span>/</span> CÁCH ĐẶT</div>
      </section>
      <section class="content-section guide-steps-section"><div class="content-section-head"><div><div class="eyebrow"><span class="eyebrow-line"></span> TỪ Ý TƯỞNG ĐẾN TIẾNG CÒI</div><h2>Ba bước ra sân</h2></div><p class="content-count">Đặt trực tuyến, theo dõi lịch ở một nơi.</p></div>
        <div class="guide-steps">
          <article><span class="guide-step-number">01</span><div class="guide-step-icon">⌖</div><div class="eyebrow">KHÁM PHÁ</div><h3>Chọn mặt sân</h3><p>Xem danh sách sân đang hoạt động, vị trí, loại sân và mức giá theo giờ.</p><a routerLink="/san-bong">Khám phá sân <span>↗</span></a></article>
          <article><span class="guide-step-number">02</span><div class="guide-step-icon">◷</div><div class="eyebrow">GIỮ KHUNG GIỜ</div><h3>Chọn ngày và giờ</h3><p>Lịch khả dụng được cập nhật theo booking. Khung giờ đã có người giữ chỗ sẽ không thể chọn.</p><a routerLink="/san-bong">Xem lịch sân <span>↗</span></a></article>
          <article><span class="guide-step-number">03</span><div class="guide-step-icon">↗</div><div class="eyebrow">XÁC NHẬN</div><h3>Hoàn tất đặt sân</h3><p>Đăng nhập, xác nhận thời lượng và tổng tiền. Trạng thái đặt sân sẽ hiển thị trong Lịch đặt.</p><a routerLink="/dang-nhap">Đăng nhập <span>↗</span></a></article>
        </div>
      </section>
      <section class="guide-note"><span class="guide-note-mark">SN</span><div><div class="eyebrow">LƯU Ý NHỎ</div><h2>Đặt xong, nhớ rủ đủ đội.</h2><p>Booking mới sẽ ở trạng thái chờ xác nhận. Bạn có thể theo dõi cập nhật trong mục Lịch đặt; quản trị viên sẽ duyệt lịch sớm nhất có thể.</p></div><a class="text-link" routerLink="/lich-dat">Lịch đặt của tôi <span>↗</span></a></section>
    </main>
  `
})
export class BookingGuideComponent {}
