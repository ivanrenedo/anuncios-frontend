import { UPLOAD_URL, TOKEN_KEY, resolveImage } from "./config";

export async function uploadImage(file: File): Promise<string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${UPLOAD_URL}/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${text}`);

  const data = JSON.parse(text);
  return resolveImage(data.url) || data.url;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await fetch(`${UPLOAD_URL}/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json();
  return (data.urls as string[]).map((u) => resolveImage(u) || u);
}
