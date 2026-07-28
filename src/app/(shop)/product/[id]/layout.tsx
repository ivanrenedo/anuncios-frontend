import type { Metadata } from "next";
import { API_URL } from "@/lib/config";

const SITE_URL = "https://bomelh.com";

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query($id: String!){
          product(id:$id){
            id title description price discount city
            seller{ name }
            category{ label }
            images{ url }
          }
        }`,
        variables: { id },
      }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  const url = `${SITE_URL}/product/${id}`;

  if (!product) {
    return {
      title: "Anuncio — Bomelh",
      alternates: { canonical: url },
    };
  }

  const priceNum = Number(product.price);
  const priceText =
    priceNum > 0 ? `${priceNum.toLocaleString("es-GQ")} XAF` : "";
  const desc = product.description
    ? String(product.description).slice(0, 200)
    : product.title;
  const description = priceText ? `${priceText} — ${desc}` : desc;

  const rawImage = product.images?.[0]?.url as string | undefined;
  const image = rawImage
    ? rawImage.startsWith("/")
      ? `${API_URL}${rawImage}`
      : rawImage
    : undefined;

  return {
    title: `${product.title} — Bomelh`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url,
      siteName: "Bomelh",
      images: image ? [{ url: image, width: 800, height: 800 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
