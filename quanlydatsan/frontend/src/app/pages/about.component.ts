import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="content-page about-page">
      <section class="content-hero about-hero"><div class="content-hero-copy"><div class="eyebrow eyebrow-light"><span class="eyebrow-line"></span> CÂU CHUYỆN SÂN NHÀ</div><h1>Đưa mọi người<br><em>gần sân cỏ hơn.</em></h1><p>Sân Nhà kết nối đội bóng với những mặt sân phù hợp, để chuyện hẹn nhau đá bóng trở nên đơn giản hơn.</p><a class="button button-lime" routerLink="/san-bong">Cùng ra sân <span>↗</span></a></div><div class="content-hero-photo about-photo" role="img" aria-label="Đồng đội cùng nhau chơi bóng"><span class="content-photo-label">MỘT ĐỘI · MỘT SÂN · MỘT TRẬN HAY</span></div><div class="content-hero-index">04 <span>/</span> VỀ SÂN NHÀ</div></section>
      <section class="content-section about-intro"><div class="about-intro-aside"><div class="eyebrow"><span class="eyebrow-line"></span> ĐIỀU CHÚNG TÔI TIN</div><span class="about-big-mark">SN<span>.</span></span><span class="about-mark-caption">CHƠI ĐẸP.<br>CHƠI VUI.</span></div><div class="about-intro-copy"><h2>Bóng đá không chỉ là <em>90 phút.</em></h2><p>Đó là cuộc hẹn sau giờ làm, là tiếng gọi đồng đội cuối tuần, là những người bạn gặp nhau bên đường biên. Sân Nhà bắt đầu từ một điều giản dị: giúp mọi đội bóng tìm được sân và giờ chơi phù hợp mà không cần gọi đi gọi lại.</p><p>Chúng tôi xây dựng một nơi để khám phá sân, xem lịch trống và giữ chỗ rõ ràng. Để bạn dành ít thời gian lo lịch hơn, và nhiều thời gian hơn cho trận đấu.</p><a class="text-link" routerLink="/cach-dat-san">Cách đặt sân <span>↗</span></a></div></section>
      <section class="about-values"><div class="eyebrow eyebrow-light"><span class="eyebrow-line"></span> CAM KẾT CỦA SÂN NHÀ</div><div class="about-value-grid"><article><span>01</span><h3>Rõ ràng từ đầu</h3><p>Thông tin sân, loại sân và giá theo giờ được hiển thị trước khi bạn xác nhận.</p></article><article><span>02</span><h3>Tôn trọng lịch của bạn</h3><p>Lịch đã có người đặt sẽ được đánh dấu để bạn không chọn nhầm khung giờ.</p></article><article><span>03</span><h3>Đồng hành cùng đội</h3><p>Lịch đặt được lưu trong tài khoản để cả đội dễ kiểm tra trạng thái trận đấu.</p></article></div></section>
      <section class="content-cta"><div><div class="eyebrow eyebrow-light">TRẬN TIẾP THEO ĐANG CHỜ</div><h2>Hẹn đội của bạn<br>trên sân cỏ.</h2></div><a class="button button-lime" routerLink="/san-bong">Tìm sân phù hợp <span>↗</span></a></section>
    </main>
  `
})
export class AboutComponent {}
