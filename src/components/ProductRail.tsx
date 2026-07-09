import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type { Product } from "@/lib/types";

export default function ProductRail({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-6">
      {loading && products.length === 0
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 sm:w-48">
              <ProductCardSkeleton />
            </div>
          ))
        : products.map((p) => (
            <div key={p.id} className="w-40 shrink-0 sm:w-48">
              <ProductCard product={p} />
            </div>
          ))}
    </div>
  );
}
