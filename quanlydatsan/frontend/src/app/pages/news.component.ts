import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NewsService } from '../core/news.service';
import { NewsArticle } from '../core/models';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [DatePipe],
  template: `
    <main class="content-page news-page">
      <section class="news-masthead"><div><div class="eyebrow"><span class="eyebrow-line"></span> NHỊP ĐẬP SÂN CỎ</div><h1>Chuyện bóng đá.<br><em>Mỗi ngày một nhịp.</em></h1><p>Tin mới từ sân cỏ Việt Nam và thế giới, cập nhật từ VnExpress Thể thao.</p></div><div class="news-masthead-stamp"><span>NEWS<br>ROOM</span><i>✳</i></div><div class="news-masthead-bottom"><span>ĐỌC · CẬP NHẬT · THẢO LUẬN</span><span>FOOTBALL / DAILY</span></div></section>
      <section class="content-section news-content"><div class="content-section-head"><div><div class="eyebrow"><span class="eyebrow-line"></span> ĐIỂM TIN MỚI NHẤT</div><h2>Tin từ sân cỏ</h2></div>@if (updatedAt()) { <div class="news-meta"><span class="news-live-dot"></span>{{ source() }} · Cập nhật {{ updatedAt() | date:'HH:mm, dd/MM/yyyy':'':'vi' }}</div> }</div>
        <div class="content-filters">@for (filter of filters; track filter) { <button class="filter-chip" [class.filter-active]="activeFilter() === filter" (click)="activeFilter.set(filter)">{{ filter }}</button> } @if (stale()) { <span class="news-stale">Đang hiển thị bản tin đã lưu</span> }</div>
        @if (loading()) { <div class="empty-state"><span class="loader"></span><p>Đang lấy tin mới từ nguồn...</p></div> }
        @else if (error()) { <div class="news-error"><span class="news-error-mark">!</span><div><b>Chưa tải được bảng tin</b><p>{{ error() }}</p><button (click)="reload()">Thử tải lại ↗</button></div></div> }
        @else if (filteredArticles().length) {
          @if (featured(); as lead) { <article class="news-featured"><a class="news-featured-image" [href]="lead.link" target="_blank" rel="noopener noreferrer" [style.background-image]="'url(' + (lead.image || fallbackImage) + ')'"><span class="news-featured-label">{{ lead.category }}</span><span class="news-featured-arrow">↗</span></a><div class="news-featured-copy"><div class="eyebrow"><span class="eyebrow-line"></span> TIN ĐÁNG CHÚ Ý</div><h2><a [href]="lead.link" target="_blank" rel="noopener noreferrer">{{ lead.title }}</a></h2><p>{{ lead.summary }}</p><div class="news-item-meta"><span>{{ lead.publishedAt | date:'HH:mm · dd/MM/yyyy':'':'vi' }}</span><a [href]="lead.link" target="_blank" rel="noopener noreferrer">Đọc bài gốc <span>↗</span></a></div></div></article> }
          <div class="news-list-heading"><h3>Cập nhật mới</h3><span>{{ filteredArticles().length }} bài viết</span></div>
          <div class="news-grid">@for (article of remainingArticles(); track article.link; let index = $index) { <article class="news-card" [style.animation-delay.ms]="index * 45"><a class="news-card-image" [href]="article.link" target="_blank" rel="noopener noreferrer" [style.background-image]="'url(' + (article.image || fallbackImage) + ')'"><span>{{ article.category }}</span></a><div class="news-card-copy"><div class="news-card-time">{{ article.publishedAt | date:'dd/MM/yyyy · HH:mm':'':'vi' }}</div><h3><a [href]="article.link" target="_blank" rel="noopener noreferrer">{{ article.title }}</a></h3><p>{{ article.summary }}</p><a class="news-read-more" [href]="article.link" target="_blank" rel="noopener noreferrer">Đọc tin <span>↗</span></a></div></article> }</div>
          <p class="news-attribution">Tin bài được tổng hợp qua RSS từ <a href="https://vnexpress.net/the-thao" target="_blank" rel="noopener noreferrer">VnExpress Thể thao</a>. Nội dung thuộc đơn vị xuất bản gốc.</p>
        } @else { <div class="empty-state"><span class="empty-mark">SN</span><h3>Chưa có tin trong mục này</h3><p>Hãy đổi bộ lọc hoặc quay lại sau.</p></div> }
      </section>
    </main>
  `
})
export class NewsComponent implements OnInit {
  private readonly newsApi = inject(NewsService);
  readonly articles = signal<NewsArticle[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly source = signal('VnExpress');
  readonly updatedAt = signal('');
  readonly stale = signal(false);
  readonly activeFilter = signal('Tất cả');
  readonly filters = ['Tất cả', 'Việt Nam', 'Quốc tế'];
  readonly fallbackImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=85';
  readonly filteredArticles = () => this.activeFilter() === 'Tất cả'
    ? this.articles()
    : this.articles().filter((article) => article.category === this.activeFilter());
  readonly featured = () => this.filteredArticles()[0] || null;
  readonly remainingArticles = () => this.filteredArticles().slice(1);

  ngOnInit() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.error.set('');
    this.newsApi.list().subscribe({
      next: (result) => {
        this.articles.set(result.articles);
        this.source.set(result.source);
        this.updatedAt.set(result.updatedAt);
        this.stale.set(Boolean(result.stale));
        this.loading.set(false);
      },
      error: (response) => {
        this.error.set(response.error?.message || 'Không thể kết nối tới dịch vụ tin tức.');
        this.loading.set(false);
      }
    });
  }
}
