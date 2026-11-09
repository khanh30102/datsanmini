import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { Booking } from './core/models';
import { PitchService } from './core/pitch.service';
import { AdminComponent } from './pages/admin.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('starts outside the admin workspace', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance.isAdminRoute()).toBe(false);
  });

  it('normalizes wrapped pitch payloads from the API', () => {
    const service = TestBed.inject(PitchService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.list().subscribe((pitches) => {
      expect(Array.isArray(pitches)).toBe(true);
      expect(pitches.length).toBe(2);
      expect(pitches[0].name).toBe('Sân A');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/pitches');
    expect(req.request.method).toBe('GET');
    req.flush({ value: [{ _id: '1', name: 'Sân A', type: 'Sân 5', pricePerHour: 300000, images: [], description: 'Test', location: 'Hà Nội', status: 'active' }, { _id: '2', name: 'Sân B', type: 'Sân 7', pricePerHour: 400000, images: [], description: 'Test 2', location: 'Hà Nội', status: 'active' }] });
    httpMock.verify();
  });

  it('filters admin bookings by code, customer, status, pitch type, and date range', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    const component = fixture.componentInstance;

    const bookings: Booking[] = [
      { _id: 'b1', bookingDate: '2026-10-12', startTime: '18:00', endTime: '19:00', totalPrice: 300000, depositAmount: 90000, paymentStatus: 'unpaid', status: 'pending', pitchId: { _id: 'p1', name: 'Sân A', type: 'Sân 5', pricePerHour: 300000, images: [], description: 'A', location: 'Hà Nội', status: 'active' }, userId: { id: 'u1', name: 'An', email: 'an@example.com', role: 'user' } },
      { _id: 'b2', bookingDate: '2026-10-12', startTime: '20:00', endTime: '21:00', totalPrice: 400000, depositAmount: 120000, paymentStatus: 'paid', status: 'confirmed', pitchId: { _id: 'p1', name: 'Sân A', type: 'Sân 5', pricePerHour: 300000, images: [], description: 'A', location: 'Hà Nội', status: 'active' }, userId: { id: 'u2', name: 'Bình', email: 'binh@example.com', role: 'user' } },
      { _id: 'b3', bookingDate: '2026-10-13', startTime: '16:00', endTime: '17:00', totalPrice: 350000, depositAmount: 105000, paymentStatus: 'refunded', status: 'cancelled', pitchId: { _id: 'p2', name: 'Sân B', type: 'Sân 7', pricePerHour: 350000, images: [], description: 'B', location: 'Đà Nẵng', status: 'active' }, userId: { id: 'u3', name: 'Cường', email: 'cuong@example.com', phone: '0900000003', role: 'user' } }
    ];

    component.bookings.set(bookings);

    expect(component.pendingBookings().map((booking) => booking._id)).toEqual(['b1']);
    expect(component.filteredBookings().length).toBe(3);
    component.bookingSearch.set('SP-B2');
    expect(component.filteredBookings().map((booking) => booking._id)).toEqual(['b2']);
    component.bookingSearch.set('0900000003');
    expect(component.filteredBookings().map((booking) => booking._id)).toEqual(['b3']);

    component.bookingSearch.set('Cường');
    component.bookingStatusFilter.set('cancelled');
    component.bookingPitchTypeFilter.set('Sân 7');
    component.bookingDateFrom.set('2026-10-13');
    component.bookingDateTo.set('2026-10-13');
    expect(component.filteredBookings().map((booking) => booking._id)).toEqual(['b3']);
  });
});
