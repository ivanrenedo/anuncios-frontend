import {
  Briefcase,
  Building2,
  Car,
  Home as HomeIcon,
  LayoutGrid,
  Shirt,
  Smartphone,
  Wrench,
} from "lucide-react";
import { resolveImage } from "@/lib/config";
import { formatPrice, timeAgo } from "@/lib/format";

// ─── Sort ──────────────────────────────────────────────────────────────────

export type SortOrder = "price_asc" | "price_desc" | "az" | "za" | null;

export const SORT_LABELS: Record<Exclude<SortOrder, null>, string> = {
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
  az: "A - Z",
  za: "Z - A",
};

// ─── Category filter descriptors ───────────────────────────────────────────
// Kept in sync with mobile/lib/exploreUtils.ts so the shop offers the same
// filters as the app for each category.

export type CatFilter = {
  icon: any;
  label?: string;
  color?: string;
  brandModel?: boolean;
  conditions?: string[];
  operations?: string[];
  engines?: string[];
  transmissions?: string[];
  offerTypes?: string[];
  bedrooms?: boolean;
  bathrooms?: boolean;
  surface?: boolean;
};

export const CATEGORY_FILTERS: Record<string, CatFilter> = {
  todos: { icon: LayoutGrid },
  moda: { icon: Shirt, conditions: ["Nuevo", "Como nuevo", "Buen estado"] },
  tech: {
    icon: Smartphone,
    brandModel: true,
    conditions: ["Nuevo", "Reacondicionado", "Buen estado", "Para piezas"],
  },
  "electrónica": {
    icon: Smartphone,
    brandModel: true,
    conditions: ["Nuevo", "Reacondicionado", "Buen estado", "Para piezas"],
  },
  hogar: { icon: HomeIcon, conditions: ["Nuevo", "Buen estado"] },
  "vehículos": {
    icon: Car,
    label: "Vehículos",
    color: "#8c5000",
    brandModel: true,
    conditions: ["Nuevo", "Buen estado", "Para piezas"],
    operations: ["Venta", "Alquiler"],
    engines: ["Gasolina", "Diésel", "Híbrido", "Eléctrico", "GLP"],
    transmissions: ["Manual", "Automático"],
  },
  inmobiliaria: {
    icon: Building2,
    label: "Inmobiliaria",
    color: "#5F5E5A",
    conditions: ["Obra nueva", "Buen estado", "A reformar"],
    operations: ["Venta", "Alquiler"],
    bedrooms: true,
    bathrooms: true,
    surface: true,
  },
  servicios: {
    icon: Wrench,
    label: "Servicios",
    color: "#006b5e",
    offerTypes: ["Oferta", "Demanda"],
  },
  empleo: {
    icon: Briefcase,
    label: "Empleo",
    color: "#ba1a1a",
  },
};

export const BRANDS: Record<string, string[]> = {
  tech: ["Apple", "Samsung", "Xiaomi", "Huawei", "Sony", "Google", "LG"],
  "electrónica": [
    "Apple", "Samsung", "Xiaomi", "Huawei", "Sony", "Google", "LG",
  ],
};

// ─── Formatters / mappers ──────────────────────────────────────────────────

/** Shape a raw API product into the object the Explore grid expects. */
export function toExploreItem(p: any) {
  const img = p.images?.[0]?.url || "";
  return {
    id: p.id,
    title: p.title,
    description: p.description || "",
    price: formatPrice(Number(p.price)),
    priceRaw: Number(p.price),
    condition: p.condition,
    location: p.city || "",
    seller: p.seller?.name || "",
    sellerId: p.seller?.id,
    verified: p.seller?.verified ?? false,
    sellerPlan: p.seller?.effectivePlan ?? p.seller?.plan ?? "FREE",
    image: resolveImage(img),
    avatar: p.seller?.avatarUrl || "",
    category: p.category?.label || "",
    categoryId: p.category?.id || "",
    categoryLabel: p.category?.label || "",
    priceNum: Number(p.price),
    createdAt: p.createdAt,
    discount: p.discount,
    operation: p.propertyDetail?.operation,
    offerType: p.serviceDetail?.offerType,
    isBoosted: p.boostedUntil ? new Date(p.boostedUntil) > new Date() : false,
    postedAgo: timeAgo(p.createdAt),
  };
}
