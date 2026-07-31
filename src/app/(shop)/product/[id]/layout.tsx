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
            images{ url thumbnailUrl }
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

  // WhatsApp mobile caps preview images ~600 KB and drops the thumbnail if
  // the fetch is slow or too heavy — the original product photo is often
  // 2-5 MB. Prefer the server-generated `thumbnailUrl`; only fall back to
  // the full-res image if the thumbnail is missing (older uploads).
  const first = product.images?.[0];
  const absolute = (u?: string | null) =>
    u ? (u.startsWith("/") ? `${API_URL}${u}` : u) : undefined;
  const image = absolute(first?.thumbnailUrl) ?? absolute(first?.url);

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
