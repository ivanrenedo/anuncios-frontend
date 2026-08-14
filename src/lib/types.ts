export interface Seller {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  location?: string | null;
  bio?: string | null;
  plan?: string | null;
  /** Backend-computed plan honoring `planExpiresAt` — use this over `plan`
   *  for feature gating (ad-free perk, boost caps, etc.). */
  effectivePlan?: string | null;
  phone?: string | null;
  showPhone?: boolean;
  /** Set when a Premium business verification was approved. Backs the 👑
   *  "verified since" label on Premium storefronts. */
  businessVerifiedAt?: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder?: number;
  type?: 'image' | 'video';
  thumbnailUrl?: string | null;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
}

export interface MarketplaceDetail {
  brand?: string | null;
  model?: string | null;
  colors?: string[];
}

export interface VehicleDetail {
  id?: string;
  operation?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  kilometrage?: number | null;
  transmission?: string | null;
  engine?: string | null;
  colors?: string[];
}

export interface PropertyDetail {
  id?: string;
  operation?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  surface?: number | null;
  address?: string | null;
}

export interface ServiceDetail {
  id?: string;
  offerType?: string | null;
}

export interface JobDetail {
  id?: string;
  link?: string | null;
}

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  discount?: number | null;
  condition?: string | null;
  city?: string | null;
  status?: string;
  views?: number;
  favoritesCount?: number;
  contacts?: number;
  impressions?: number;
  bumpedAt?: string;
  boostedUntil?: string | null;
  /** Set by the backend when the seller drops the price. The frontend renders
   *  the "Rebajado hoy" chip while `now < priceReducedUntil` (48h window,
   *  gated to Star/Premium sellers by the card). */
  priceReducedUntil?: string | null;
  createdAt?: string;
  seller?: Seller;
  category?: Category;
  images?: ProductImage[];
  attributes?: { id: string; label: string; value: string }[];
  marketplaceDetail?: MarketplaceDetail | null;
  vehicleDetail?: VehicleDetail | null;
  propertyDetail?: PropertyDetail | null;
  serviceDetail?: ServiceDetail | null;
  jobDetail?: JobDetail | null;
}

export interface CategoryTreeNode {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
  icon?: string | null;
  sortOrder?: number;
  children?: CategoryTreeNode[];
}

export interface SavedSearch {
  id: string;
  query?: string | null;
  categoryId?: string | null;
  city?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  verified: boolean;
  permission?: string | null;
  suspended?: boolean;
  suspendedReason?: string | null;
  language?: string | null;
  plan?: string | null;
  /** MONTHLY | YEARLY — how the current plan is billed (v2). */
  planCycle?: string | null;
  planStartedAt?: string | null;
  planExpiresAt?: string | null;
  effectivePlan?: string | null;
  businessVerifiedAt?: string | null;
  maxActiveProducts?: number;
  maxImagesPerProduct?: number;
  notifMessages?: boolean;
  notifOffers?: boolean;
  notifMarketing?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  qrShowPhone?: boolean;
  qrShowEmail?: boolean;
  themePreference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
