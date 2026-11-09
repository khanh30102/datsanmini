import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PitchReviewResponse, PitchReview } from './models';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/reviews`;

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  forPitch(pitchId: string) {
    return this.http.get<PitchReviewResponse>(`${API}/pitch/${pitchId}`);
  }

  create(payload: { bookingId: string; rating: number; comment: string }) {
    return this.http.post<PitchReview>(API, payload);
  }
}
