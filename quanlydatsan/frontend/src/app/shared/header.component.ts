import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <a class="brand" routerLink="/" aria-label="Sân Nhà, trang chủ">
        <span class="brand-mark">SN</span><span>SÂN NHÀ<span class="brand-dot">.</span></span>
      </a>
      <nav class="main-nav" [class.nav-open]="menuOpen()" aria-label="Điều hướng chính">
        <a routerLink="/san-bong" routerLinkActive="nav-active" (click)="menuOpen.set(false)">Sân bóng</a>
        <a routerLink="/cach-dat-san" routerLinkActive="nav-active" (click)="menuOpen.set(false)">Cách đặt sân</a>
        <a routerLink="/tin-tuc" routerLinkActive="nav-active" (click)="menuOpen.set(false)">Tin tức</a>
        <a routerLink="/gioi-thieu" routerLinkActive="nav-active" (click)="menuOpen.set(false)">Giới thiệu</a>
      </nav>
      <div class="header-actions">
        @if (auth.user(); as user) {
          <a class="admin-link" routerLink="/lich-dat">Lịch đặt</a>
          @if (user.role === 'admin') { <a class="admin-link" routerLink="/admin">Quản trị</a> }
          <span class="user-greeting">Xin chào, {{ user.name }}</span>
          <button class="button button-quiet button-small" (click)="logout()">Đăng xuất</button>
        } @else {
          <a class="login-link" routerLink="/dang-nhap">Đăng nhập</a>
          <a class="button button-dark button-small" routerLink="/dang-nhap" [queryParams]="{ mode: 'register' }">Tạo tài khoản <span aria-hidden="true">↗</span></a>
        }
      </div>
      <button class="menu-toggle" type="button" (click)="menuOpen.update((open) => !open)" [attr.aria-expanded]="menuOpen()" aria-label="Mở menu điều hướng"><span></span><span></span></button>
    </header>
  `
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);

  logout() {
    this.auth.logout();
  }
}