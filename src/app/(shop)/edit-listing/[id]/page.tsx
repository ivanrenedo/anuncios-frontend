"use client";

import { useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ArrowLeft,
  ShoppingBag,
  Car,
  Building2,
  Briefcase,
  Wrench,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { GET_PRODUCT } from "@/graphql/queries";
import { UPDATE_PRODUCT } from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { uploadImages } from "@/lib/upload";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import Spinner from "@/components/Spinner";
import type { Product } from "@/lib/types";

type Kind = "MarketPlace" | "vehiculos" | "servicios" | "inmobiliaria" | "empleo";

const KIND_META: Record<Kind, { label: string; Icon: React.ElementType; color: string }> = {
  MarketPlace: { label: "MarketPlace", Icon: ShoppingBag, color: "#14b8a6" },
  vehiculos: { label: "Vehiculos", Icon: Car, color: "#3b82f6" },
  inmobiliaria: { label: "Inmobiliaria", Icon: Building2, color: "#f59e0b" },
  servicios: { label: "Servicios", Icon: Wrench, color: "#8b5cf6" },
  empleo: { label: "Empleo", Icon: Briefcase, color: "#22c55e" },
};

const CONDITIONS_FULL = ["Sin abrir", "Nuevo", "Como nuevo", "En buen estado", "Aceptable", "Lo ha dado todo"];
const PROPERTY_CONDITIONS = ["Obra nueva", "Buen estado", "A reformar"];
const PROPERTY_OPERATIONS = ["Venta", "Alquiler"];
const ENGINE_TYPES = ["Gasolina", "Diesel", "Hibrido", "Electrico", "GLP"];
const TRANSMISSION_TYPES = ["Manual", "Automatico"];
const SERVICE_OPTIONS = ["Oferta", "Demanda"];

function kindFromProduct(product: Product): Kind {
  if (product.vehicleDetail) return "vehiculos";
  if (product.propertyDetail) return "inmobiliaria";
  if (product.serviceDetail) return "servicios";
  if (product.jobDetail) return "empleo";
  return "MarketPlace";
}

function prefillForm(product: Product): Record<string, any> {
  const form: Record<string, any> = {
    title: product.title || "",
    description: product.description || "",
    price: product.price?.toString() || "",
    discount: product.discount?.toString() || "",
    condition: product.condition || "",
    city: product.city || "",
    categoryId: product.category?.id || "",
    existingImages: product.images?.map((img) => ({ id: img.id, url: img.url })) || [],
    photos: [],
  };

  if (product.marketplaceDetail) {
    form.brand = product.marketplaceDetail.brand || "";
    form.model = product.marketplaceDetail.model || "";
  }
  if (product.vehicleDetail) {
    const v = product.vehicleDetail;
    form.operation = v.operation || "";
    form.brand = v.brand || "";
    form.model = v.model || "";
    form.year = v.year?.toString() || "";
    form.kilometrage = v.kilometrage?.toString() || "";
    form.transmission = v.transmission || "";
    form.engine = v.engine || "";
  }
  if (product.propertyDetail) {
    const p = product.propertyDetail;
    form.operation = p.operation || "";
    form.bedrooms = p.bedrooms?.toString() || "";
    form.bathrooms = p.bathrooms?.toString() || "";
    form.floor = p.floor?.toString() || "";
    form.surface = p.surface?.toString() || "";
    form.address = p.address || "";
  }
  if (product.serviceDetail) {
    form.offerType = product.serviceDetail.offerType || "";
  }
  if (product.jobDetail) {
    form.link = product.jobDetail.link || "";
  }

  return form;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const { data, loading } = useQuery(GET_PRODUCT, { variables: { id } });
  const product: Product | null = (data as any)?.product ?? null;

  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: ["Products", "ProductsBySeller", "Product"],
    awaitRefetchQueries: true,
  });

  const setField = useCallback(
    (k: string, v: any) => setForm((p) => (p ? { ...p, [k]: v } : p)),
    [],
  );

  // Initialize form once product loads
  if (product && !form) {
    setForm(prefillForm(product));
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Anuncio no encontrado</p>
        <button onClick={() => router.back()} className="text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  if (user?.id !== product.seller?.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">No tienes permiso para editar este anuncio</p>
        <button onClick={() => router.back()} className="text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  if (!form) return null;

  const kind = kindFromProduct(product);
  const meta = KIND_META[kind];
  const KindIcon = meta.Icon;

  const existingImages: { id: string; url: string }[] = (form.existingImages || []).filter(
    (img: any) => !removedImageIds.includes(img.id),
  );

  const handleRemoveExisting = (imgId: string) => {
    setRemovedImageIds((prev) => [...prev, imgId]);
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setField("photos", [...(form.photos || []), ...files]);
  };

  const handleRemoveNew = (idx: number) => {
    setField("photos", (form.photos || []).filter((_: any, i: number) => i !== idx));
  };

  const handleSubmit = async () => {
    if (submittingRef.current || updating) return;
    submittingRef.current = true;
    setError("");

    try {
      let newImageUrls: string[] = [];
      if (form.photos && form.photos.length > 0) {
        newImageUrls = await uploadImages(form.photos as File[]);
      }

      const keepImages = existingImages.map((img) => img.url);
      const allImages = [...keepImages, ...newImageUrls];

      const input: any = {
        title: form.title || undefined,
        description: form.description || undefined,
        price: form.price ? parseFloat(String(form.price).replace(/\./g, "").replace(",", ".")) : undefined,
        discount: form.discount ? parseInt(form.discount) : 0,
        condition: form.condition || undefined,
        city: form.city || undefined,
        imageUrls: allImages,
      };

      if (kind === "MarketPlace" && (form.brand || form.model)) {
        input.marketplaceDetail = { brand: form.brand || undefined, model: form.model || undefined };
      } else if (kind === "vehiculos") {
        input.vehicleDetail = {
          operation: form.operation || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          kilometrage: form.kilometrage ? parseInt(form.kilometrage) : undefined,
          transmission: form.transmission || undefined,
          engine: form.engine || undefined,
        };
      } else if (kind === "inmobiliaria") {
        input.propertyDetail = {
          operation: form.operation || undefined,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          floor: form.floor ? parseInt(form.floor) : undefined,
          surface: form.surface ? parseInt(form.surface) : undefined,
          address: form.address || undefined,
        };
      } else if (kind === "servicios") {
        input.serviceDetail = { offerType: form.offerType || undefined };
      } else if (kind === "empleo") {
        input.jobDetail = { link: form.link || undefined };
      }

      await updateProduct({ variables: { id, input } });
      submittingRef.current = false;
      router.push(`/product/${id}`);
    } catch (err) {
      submittingRef.current = false;
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ backgroundColor: meta.color + "15" }}
          >
            <KindIcon size={18} strokeWidth={1.6} style={{ color: meta.color }} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Editar anuncio</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Images */}
      <section className="mt-6">
        <label className="text-sm font-bold text-on-surface">Fotos</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {existingImages.map((img) => (
            <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-outline-variant/30">
              <img
                src={resolveImage(img.url)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveExisting(img.id)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {(form.photos || []).map((file: File, idx: number) => (
            <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-xl border border-outline-variant/30">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveNew(idx)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-outline-variant/50 text-muted transition hover:border-primary hover:text-primary">
            <div className="flex flex-col items-center gap-1">
              <Upload size={20} />
              <span className="text-[10px]">Añadir</span>
            </div>
            <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
          </label>
        </div>
      </section>

      {/* Common fields */}
      <section className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-bold text-on-surface">Titulo</label>
          <input
            type="text"
            value={form.title || ""}
            onChange={(e) => setField("title", e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-on-surface">Descripcion</label>
          <textarea
            value={form.description || ""}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-primary resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-on-surface">Precio (XAF)</label>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) => setField("price", e.target.value)}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-on-surface">Descuento %</label>
            <input
              type="number"
              min={0}
              max={99}
              value={form.discount || ""}
              onChange={(e) => setField("discount", e.target.value)}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-on-surface">Ciudad</label>
          <input
            type="text"
            value={form.city || ""}
            onChange={(e) => setField("city", e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
          />
        </div>
      </section>

      {/* Kind-specific fields */}
      <section className="mt-6 space-y-4">
        {(kind === "MarketPlace" || kind === "vehiculos") && (
          <div>
            <label className="text-sm font-bold text-on-surface">Estado</label>
            <select
              value={form.condition || ""}
              onChange={(e) => setField("condition", e.target.value)}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Seleccionar</option>
              {CONDITIONS_FULL.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {(kind === "MarketPlace" || kind === "vehiculos") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-on-surface">Marca</label>
              <input
                type="text"
                value={form.brand || ""}
                onChange={(e) => setField("brand", e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-on-surface">Modelo</label>
              <input
                type="text"
                value={form.model || ""}
                onChange={(e) => setField("model", e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {kind === "vehiculos" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-on-surface">Operacion</label>
                <select
                  value={form.operation || ""}
                  onChange={(e) => setField("operation", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Seleccionar</option>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface">Año</label>
                <input
                  type="number"
                  value={form.year || ""}
                  onChange={(e) => setField("year", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-on-surface">Kilometraje</label>
                <input
                  type="number"
                  value={form.kilometrage || ""}
                  onChange={(e) => setField("kilometrage", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface">Cambio</label>
                <select
                  value={form.transmission || ""}
                  onChange={(e) => setField("transmission", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Seleccionar</option>
                  {TRANSMISSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-on-surface">Motor</label>
              <select
                value={form.engine || ""}
                onChange={(e) => setField("engine", e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Seleccionar</option>
                {ENGINE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {kind === "inmobiliaria" && (
          <>
            <div>
              <label className="text-sm font-bold text-on-surface">Estado</label>
              <select
                value={form.condition || ""}
                onChange={(e) => setField("condition", e.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Seleccionar</option>
                {PROPERTY_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-on-surface">Operacion</label>
                <select
                  value={form.operation || ""}
                  onChange={(e) => setField("operation", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Seleccionar</option>
                  {PROPERTY_OPERATIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface">Habitaciones</label>
                <input
                  type="number"
                  min={0}
                  value={form.bedrooms || ""}
                  onChange={(e) => setField("bedrooms", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-on-surface">Baños</label>
                <input
                  type="number"
                  min={0}
                  value={form.bathrooms || ""}
                  onChange={(e) => setField("bathrooms", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface">Planta</label>
                <input
                  type="number"
                  value={form.floor || ""}
                  onChange={(e) => setField("floor", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-on-surface">Superficie m²</label>
                <input
                  type="number"
                  value={form.surface || ""}
                  onChange={(e) => setField("surface", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-on-surface">Direccion</label>
                <input
                  type="text"
                  value={form.address || ""}
                  onChange={(e) => setField("address", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </>
        )}

        {kind === "servicios" && (
          <div>
            <label className="text-sm font-bold text-on-surface">Modalidad</label>
            <select
              value={form.offerType || ""}
              onChange={(e) => setField("offerType", e.target.value)}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Seleccionar</option>
              {SERVICE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        )}

        {kind === "empleo" && (
          <div>
            <label className="text-sm font-bold text-on-surface">Enlace de la oferta</label>
            <input
              type="url"
              value={form.link || ""}
              onChange={(e) => setField("link", e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-container"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={updating}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
        >
          {updating ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </div>
  );
}
