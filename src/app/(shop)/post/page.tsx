"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { ImagePlus, Plus, Tag } from "lucide-react";
import { CREATE_PRODUCT } from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";

const CONDITIONS = ["Nuevo", "Como nuevo", "Buen estado", "Usado"];

export default function PostPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { categories } = useCategories();
  // Refetch active product lists by operation name so the new listing shows up
  // instantly (home, explore, category, profile) without a page refresh.
  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [
      "Products",
      "ProductsBySeller",
      "ProductsByCategory",
      "SearchProducts",
    ],
    awaitRefetchQueries: true,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState("");
  const [error, setError] = useState("");

  // Flatten the 2-level tree into an ordered list: each parent followed by its
  // subcategories (indented in the dropdown).
  const catOptions = categories
    .filter((c: any) => !c.parentId)
    .flatMap((root: any) => [
      { id: root.id, label: root.label, child: false },
      ...categories
        .filter((c: any) => c.parentId === root.id)
        .map((c: any) => ({ id: c.id, label: c.label, child: true })),
    ]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Tag size={28} />
        </div>
        <p className="mt-4 text-lg font-bold">Inicia sesión para vender</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Necesitas una cuenta para publicar anuncios en Market EG.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) {
      setError("Selecciona una categoría");
      return;
    }
    const imageUrls = images
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const { data } = await createProduct({
        variables: {
          input: {
            title: title.trim(),
            description: description.trim() || undefined,
            price: Number(price) || 0,
            condition,
            city,
            categoryId,
            imageUrls: imageUrls.length ? imageUrls : undefined,
          },
        },
      });
      const id = (data as any)?.createProduct?.id;
      if (id) router.push(`/product/${id}`);
      else router.push("/profile");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo publicar"));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Publicar anuncio</h1>
      <p className="mt-1 text-sm text-muted">
        Rellena los datos y llega a miles de compradores.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Título">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. iPhone 15 Pro Max 256GB"
            className={inputCls}
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe el estado, características y detalles…"
            className={`${inputCls} resize-none py-3`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio (XAF)">
            <input
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
          <Field label="Estado">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputCls}
            >
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Categoría">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {catOptions.map((c: { id: string; label: string; child: boolean }) => (
              <option key={c.id} value={c.id}>
                {c.child ? `   — ${c.label}` : c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ubicación (Ciudad)">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ej: Malabo, Bata…"
            className={inputCls}
          />
        </Field>

        <Field label="Imágenes (URLs, una por línea)">
          <textarea
            value={images}
            onChange={(e) => setImages(e.target.value)}
            rows={3}
            placeholder="https://…/foto1.jpg"
            className={`${inputCls} resize-none py-3 font-mono text-xs`}
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <ImagePlus size={13} /> Pega enlaces de imágenes separados por líneas.
          </p>
        </Field>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Spinner size={18} /> : <Plus size={18} strokeWidth={2.4} />}
          {loading ? "Publicando…" : "Publicar anuncio"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-on-surface">
        {label}
      </label>
      {children}
    </div>
  );
}
