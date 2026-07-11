export interface Seller {
  id: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  location?: string | null;
  bio?: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder?: number;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
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
  bumpedAt?: string;
  boostedUntil?: string | null;
  createdAt?: string;
  seller?: Seller;
  category?: Category;
  images?: ProductImage[];
  attributes?: { id: string; label: string; value: string }[];
}
