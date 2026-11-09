import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { AuthComponent } from './pages/auth.component';
import { HomeComponent } from './pages/home.component';
import { MyBookingsComponent } from './pages/my-bookings.component';
import { PitchDetailComponent } from './pages/pitch-detail.component';
import { userGuard } from './core/user.guard';
import { PitchCatalogComponent } from './pages/pitch-catalog.component';
import { BookingGuideComponent } from './pages/booking-guide.component';
import { NewsComponent } from './pages/news.component';
import { AboutComponent } from './pages/about.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent, title: 'Sân Nhà | Đặt sân bóng' },
	{ path: 'san-bong', component: PitchCatalogComponent, title: 'Danh sách sân | Sân Nhà' },
	{ path: 'san-bong/:id', component: PitchDetailComponent, title: 'Chi tiết sân | Sân Nhà' },
	{ path: 'cach-dat-san', component: BookingGuideComponent, title: 'Cách đặt sân | Sân Nhà' },
	{ path: 'tin-tuc', component: NewsComponent, title: 'Tin bóng đá | Sân Nhà' },
	{ path: 'gioi-thieu', component: AboutComponent, title: 'Về Sân Nhà | Sân Nhà' },
	{ path: 'dang-nhap', component: AuthComponent, title: 'Tài khoản | Sân Nhà' },
	{ path: 'lich-dat', component: MyBookingsComponent, canActivate: [userGuard], title: 'Lịch đặt | Sân Nhà' },
	{ path: 'admin', loadComponent: () => import('./pages/admin.component').then((module) => module.AdminComponent), canActivate: [adminGuard], title: 'Quản trị | Sân Nhà' },
	{ path: '**', redirectTo: '' }
];
