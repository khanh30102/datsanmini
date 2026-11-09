import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="footer-main">
        <div class="footer-brand"><a class="brand brand-light" routerLink="/"><span class="brand-mark">SN</span><span>SÂN NHÀ<span class="brand-dot">.</span></span></a><p>Thêm một trận hay vào lịch của bạn.</p></div>
        <div><span class="footer-label">KHÁM PHÁ</span><a routerLink="/san-bong">Sân bóng</a><a routerLink="/cach-dat-san">Cách đặt sân</a></div>
        <div><span class="footer-label">SÂN NHÀ</span><a routerLink="/tin-tuc">Tin bóng đá</a><a routerLink="/gioi-thieu">Giới thiệu</a></div>
        <div><span class="footer-label">LIÊN HỆ</span><a href="tel:1900636288">1900 636 288</a><a href="mailto:hello@sannha.vn">hello&#64;sannha.vn</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Sân Nhà. Đặt sân, ra sân.</span><span>Chơi đẹp. Chơi vui.</span></div>
    </footer>
  `
})
export class FooterComponent {}