import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type { Product } from "@/lib/types";

export default function ProductGrid({
  products,
  loading,
  skeletonCount = 10,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-4 sm:grid-cols-3 sm:px-6 md:grid-cols-4 lg:grid-cols-5">
      {loading && products.length === 0
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
