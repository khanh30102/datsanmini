import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Booking, Pitch } from './models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PitchService {
  private readonly http = inject(HttpClient);

  list(all = false): Observable<Pitch[]> {
    return this.http.get<unknown>(all ? `${API}/pitches/admin/all` : `${API}/pitches`).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response as Pitch[];
        }

        if (response && typeof response === 'object' && Array.isArray((response as { value?: unknown }).value)) {
          return (response as { value: Pitch[] }).value;
        }

        return [] as Pitch[];
      })
    );
  }

  get(id: string) {
    return this.http.get<Pitch>(`${API}/pitches/${id}`);
  }

  create(pitch: Partial<Pitch>) {
    return this.http.post<Pitch>(`${API}/pitches`, pitch);
  }

  update(id: string, pitch: Partial<Pitch>) {
    return this.http.put<Pitch>(`${API}/pitches/${id}`, pitch);
  }

  uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return this.http.post<{ images: string[] }>(`${API}/pitches/upload`, formData);
  }

  remove(id: string) {
    return this.http.delete(`${API}/pitches/${id}`);
  }

  availability(id: string, date: string) {
    return this.http.get<Booking[]>(`${API}/bookings/availability`, { params: { pitchId: id, date } });
  }
}