import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NewsResponse } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<NewsResponse>(`${environment.apiUrl}/news`);
  }
}
