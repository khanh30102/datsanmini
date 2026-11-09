export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
}

export interface AdminAccount extends AppUser {
  createdAt: string;
}

export interface Pitch {
  _id: string;
  name: string;
  type: string;
  pricePerHour: number;
  images: string[];
  description: string;
  location: string;
  status: 'active' | 'inactive';
}

export interface Booking {
  _id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  depositAmount: number;
  cancellationReason?: string;
  paymentStatus: 'unpaid' | 'payment_requested' | 'paid' | 'refunded';
  status: 'pending' | 'confirmed' | 'cancelled';
  reviewSubmitted?: boolean;
  pitchId: Pitch | string;
  userId?: AppUser | string;
}

export interface Voucher {
  _id: string;
  code: string;
  description: string;
  value: number;
  type: 'percentage' | 'fixed' | 'offpeak';
  active: boolean;
  maxUses: number | null;
  usedCount: number;
  createdAt?: string;
}

export interface Promotion {
  _id: string;
  name: string;
  value: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt?: string;
}

export interface PitchReview {
  _id: string;
  bookingId: string;
  pitchId: string;
  userId: AppUser | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PitchReviewResponse {
  reviews: PitchReview[];
  average: number;
  count: number;
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}

export interface NewsArticle {
  title: string;
  link: string;
  summary: string;
  image: string;
  publishedAt: string | null;
  category: 'Việt Nam' | 'Quốc tế';
}

export interface NewsResponse {
  articles: NewsArticle[];
  source: string;
  stale?: boolean;
  updatedAt: string;
}