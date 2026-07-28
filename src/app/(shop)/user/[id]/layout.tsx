import type { Metadata } from "next";
import { API_URL } from "@/lib/config";

const SITE_URL = "https://bomelh.com";

async function fetchUser(id: string) {
  try {
    const res = await fetch(`${API_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query($id: String!){
          user(id:$id){
            id name bio avatarUrl coverUrl location verified plan
          }
        }`,
        variables: { id },
      }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.user ?? null;
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
  const user = await fetchUser(id);
  const url = `${SITE_URL}/user/${id}`;

  if (!user) {
    return {
      title: "Perfil — Bomelh",
      alternates: { canonical: url },
    };
  }

  const name = user.name || "Perfil";
  const description = user.bio
    ? String(user.bio).slice(0, 200)
    : `Mira el perfil de ${name} en Bomelh`;

  const resolve = (u?: string | null) =>
    u ? (u.startsWith("/") ? `${API_URL}${u}` : u) : undefined;
  const image = resolve(user.coverUrl) || resolve(user.avatarUrl);

  return {
    title: `${name} — Bomelh`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title: name,
      description,
      url,
      siteName: "Bomelh",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
