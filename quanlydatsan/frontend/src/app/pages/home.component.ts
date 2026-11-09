import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pitch } from '../core/models';
import { PitchService } from '../core/pitch.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly pitchesApi = inject(PitchService);
  readonly pitches = signal<Pitch[]>([]);
  readonly loading = signal(true);
  readonly apiUnavailable = signal(false);
  readonly selectedType = signal('Tất cả');
  readonly types = ['Tất cả', 'Sân 5', 'Sân 7', 'Sân 11'];
  readonly filteredPitches = () => {
    const type = this.selectedType();
    return type === 'Tất cả' ? this.pitches() : this.pitches().filter((pitch) => pitch.type === type);
  };

  ngOnInit() {
    this.pitchesApi.list().subscribe({
      next: (pitches) => { this.pitches.set(pitches); this.loading.set(false); },
      error: () => { this.apiUnavailable.set(true); this.loading.set(false); }
    });
  }
}