"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ArrowLeft,
  ShoppingBag,
  Car,
  Building2,
  Briefcase,
  Wrench,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  X,
  Upload,
  Eye,
  Minus,
  LogIn,
} from "lucide-react";
import { CATEGORY_TREE } from "@/graphql/queries";
import { PRODUCTS_BY_SELLER } from "@/graphql/queries";
import { CREATE_PRODUCT } from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { uploadImages } from "@/lib/upload";
import { optimizeImage } from "@/lib/imageOptimizer";
import { getErrorMessage } from "@/lib/errors";
import Spinner from "@/components/Spinner";
import type { CategoryTreeNode } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────────────────────────────────────

type Kind = "MarketPlace" | "vehiculos" | "servicios" | "inmobiliaria" | "empleo";

const KIND_META: Record<
  Kind,
  { label: string; subtitle: string; Icon: React.ElementType; color: string }
> = {
  MarketPlace: {
    label: "MarketPlace",
    subtitle: "Vende artículos nuevos o de segunda mano",
    Icon: ShoppingBag,
    color: "#14b8a6",
  },
  vehiculos: {
    label: "Vehiculos",
    subtitle: "Coches, motos, camiones y más",
    Icon: Car,
    color: "#3b82f6",
  },
  inmobiliaria: {
    label: "Inmobiliaria",
    subtitle: "Pisos, casas, locales y terrenos",
    Icon: Building2,
    color: "#f59e0b",
  },
  servicios: {
    label: "Servicios",
    subtitle: "Ofrece tu trabajo, profesionalidad o busca servicios",
    Icon: Wrench,
    color: "#8b5cf6",
  },
  empleo: {
    label: "Empleo",
    subtitle: "Publica una oferta o búscala",
    Icon: Briefcase,
    color: "#22c55e",
  },
};

const CONDITIONS_FULL = [
  "Sin abrir",
  "Nuevo",
  "Como nuevo",
  "En buen estado",
  "Aceptable",
  "Lo ha dado todo",
];
const CONDITIONS_VEHICLE = ['Nuevo','Buen estado', 'Para piezas'];
const PROPERTY_CONDITIONS = ["Obra nueva", "Buen estado", "A reformar"];
const PROPERTY_OPERATIONS = ["Venta", "Alquiler"];
const ENGINE_TYPES = ["Gasolina", "Diesel", "Hibrido", "Electrico", "GLP"];
const TRANSMISSION_TYPES = ["Manual", "Automatico"];
const SERVICE_OPTIONS = ["Oferta", "Demanda"];

const SPECIALIZED_LABELS = ["vehiculos", "inmobiliaria", "servicios", "empleo"];
const KIND_TO_CATEGORY: Record<Kind, string | null> = {
  vehiculos: "vehiculos",
  inmobiliaria: "inmobiliaria",
  servicios: "servicios",
  empleo: "empleo",
  MarketPlace: null,
};

function filterTreeByKind(tree: CategoryTreeNode[], kind: Kind): CategoryTreeNode[] {
  const mapped = KIND_TO_CATEGORY[kind];
  if (mapped) {
    const match = tree.find(
      (c) => c.label.toLowerCase() === mapped || c.slug?.toLowerCase() === mapped,
    );
    return match ? [match] : [];
  }
  return tree.filter(
    (c) => !SPECIALIZED_LABELS.includes(c.label.toLowerCase()) && !SPECIALIZED_LABELS.includes(c.slug?.toLowerCase() ?? ""),
  );
}

type FormState = Record<string, any>;

function getMissingFields(kind: Kind, form: FormState): string[] {
  const missing: string[] = [];
  const check = (val: unknown, label: string) => {
    if (val === undefined || val === null || val === "") missing.push(label);
  };

  if (!form.photos || form.photos.length === 0) missing.push("Fotos");
  check(form.categoryId, "Categoría");
  check(form.title, "Título");
  check(form.description, "Descripción");
  check(form.city, "Ubicación");

  switch (kind) {
    case "MarketPlace":
      check(form.condition, "Estado");
      break;
    case "vehiculos":
      check(form.condition, "Estado");
      check(form.transmission, "Cambio");
      check(form.engine, "Motor");
      break;
    case "servicios":
      check(form.offerType, "Modalidad");
      break;
    case "inmobiliaria":
      check(form.condition, "Estado");
      if (!form.bedrooms || form.bedrooms <= 0) missing.push("Habitaciones");
      check(form.address, "Direccion");
      break;
  }

  return missing;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

export default function PostPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kind, setKind] = useState<Kind | null>(null);
  const [form, setForm] = useState<FormState>({ photos: [] });
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  // Category tree
  const { data: catData } = useQuery(CATEGORY_TREE);
  const tree: CategoryTreeNode[] = (catData as any)?.categoryTree ?? [];

  // My products (for limit check)
  const { data: myData } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: user?.id ?? "" },
    skip: !user?.id,
  });
  const myProducts = (myData as any)?.productsBySeller ?? [];

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: ["Products", "ProductsBySeller"],
    awaitRefetchQueries: true,
  });

  const setField = useCallback(
    (k: string, v: any) => setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  // Auth gate
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-primary/10">
            <ShoppingBag size={48} strokeWidth={1.2} className="text-primary" />
          </div>
          <h2 className="text-xl font-extrabold">Publica tu anuncio</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm text-on-surface-variant">
            Inicia sesión para publicar anuncios y empezar a vender en Market
            EG.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary transition hover:opacity-90"
          >
            <LogIn size={18} strokeWidth={2} />
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 1: Kind picker ─────────────────────────────────────────────────
  if (step === 1 || !kind) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Progress */}
        <StepProgress current={1} />

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">
          Publicar anuncio
        </h1>
        <p className="mt-1 text-sm text-muted">¿Qué quieres publicar hoy?</p>

        <div className="mt-6 space-y-3">
          {(Object.keys(KIND_META) as Kind[]).map((k) => {
            const meta = KIND_META[k];
            const KindIcon = meta.Icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setStep(2);
                }}
                className="flex w-full items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-left transition hover:border-primary/30 hover:shadow-card"
              >
                <div
                  className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl"
                  style={{ backgroundColor: meta.color + "15" }}
                >
                  <KindIcon
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: meta.color }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-on-surface">
                    {meta.label}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {meta.subtitle}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-on-surface-variant"
                  strokeWidth={1.8}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step 2: Category picker ─────────────────────────────────────────────
  if (step === 2) {
    const filtered = filterTreeByKind(tree, kind);
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <StepProgress current={2} />

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setKind(null);
              setForm({ photos: [] });
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Categoría
            </h1>
            <p className="text-sm text-muted">
              Elige la categoría de tu anuncio
            </p>
          </div>
        </div>

        <CategoryPicker
          tree={filtered}
          selected={form.categoryId}
          onSelect={(id, label) => {
            setField("categoryId", id);
            setField("categoryLabel", label);
            setStep(3);
          }}
        />
      </div>
    );
  }

  // ── Step 3: Product form ────────────────────────────────────────────────
  const meta = KIND_META[kind];

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    // Plan limit check
    const plan = profile?.effectivePlan ?? profile?.plan ?? "FREE";
    const PLAN_NAMES: Record<string, string> = {
      FREE: "Gratis",
      STAR: "Estrella",
      PREMIUM: "Premium",
    };
    const limit = profile?.maxActiveProducts;
    if (limit != null && myProducts.length >= limit) {
      setError(
        `Tu plan ${PLAN_NAMES[plan] ?? plan} permite hasta ${limit} anuncios activos. Mejora tu plan para publicar más.`,
      );
      return;
    }

    // Validate
    const missing = getMissingFields(kind, form);
    if (missing.length > 0) {
      setShowErrors(true);
      setError(`Completa los siguientes campos: ${missing.join(", ")}`);
      return;
    }

    submittingRef.current = true;
    setError("");

    try {
      // Upload images
      let imageUrls: string[] = [];
      if (form.photos && form.photos.length > 0) {
        const files = form.photos as File[];
        imageUrls = await uploadImages(files);
      }

      const input: any = {
        title: form.title || "Sin titulo",
        price: parseFloat(String(form.price || "0").replace(/\./g, "").replace(",", ".")),
        discount: form.discount ? parseInt(form.discount) : undefined,
        description: form.description,
        condition: form.condition,
        city: form.city,
        imageUrls,
      };

      if (form.categoryId) input.categoryId = form.categoryId;

      const colorsArr: string[] | undefined =
        Array.isArray(form.colors) && form.colors.length > 0
          ? form.colors
          : undefined;

      if (
        kind === "MarketPlace" &&
        (form.brand || form.model || colorsArr)
      ) {
        input.marketplaceDetail = {
          brand: form.brand || undefined,
          model: form.model || undefined,
          colors: colorsArr,
        };
      } else if (kind === "vehiculos") {
        input.vehicleDetail = {
          operation: form.operation || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          kilometrage: form.kilometrage ? parseInt(form.kilometrage) : undefined,
          transmission: form.transmission || undefined,
          engine: form.engine || undefined,
          colors: colorsArr,
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

      const { data } = await createProduct({ variables: { input } });
      submittingRef.current = false;
      const id = (data as any)?.createProduct?.id;
      if (id) router.push(`/product/${id}`);
      else router.push("/profile");
    } catch (err) {
      submittingRef.current = false;
      setError(getErrorMessage(err, "No se pudo publicar el anuncio."));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <StepProgress current={3} />

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Publicar {meta.label.toLowerCase()}
          </h1>
          <p className="text-sm text-muted">
            {form.categoryLabel ?? "Rellena los detalles"}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Photo upload */}
        <PhotoPicker
          photos={form.photos ?? []}
          setPhotos={(p) => setField("photos", p)}
          showErrors={showErrors}
          maxPhotos={profile?.maxImagesPerProduct ?? 4}
        />

        {/* Kind-specific form */}
        {kind === "MarketPlace" && (
          <MarketPlaceForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === "vehiculos" && (
          <VehiculoForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === "servicios" && (
          <ServicioForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === "inmobiliaria" && (
          <InmobiliariaForm form={form} setField={setField} showErrors={showErrors} />
        )}
        {kind === "empleo" && (
          <EmpleoForm form={form} setField={setField} showErrors={showErrors} />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
            {error.includes("plan") && (
              <Link
                href="/plans"
                className="ml-2 font-bold underline"
              >
                Ver planes
              </Link>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={creating}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-primary font-bold text-on-primary shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? (
            <Spinner size={18} />
          ) : (
            <Eye size={20} strokeWidth={2} />
          )}
          {creating ? "Publicando..." : "Publicar anuncio"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Progress
// ─────────────────────────────────────────────────────────────────────────────

function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Tipo", "Categoría", "Detalles"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-0.5 w-6 rounded ${
                  done ? "bg-primary" : "bg-outline-variant/30"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-primary text-on-primary"
                    : done
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} /> : n}
              </span>
              <span
                className={`text-xs font-semibold ${
                  active
                    ? "text-on-surface"
                    : "text-on-surface-variant"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category Picker
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPicker({
  tree,
  selected,
  onSelect,
}: {
  tree: CategoryTreeNode[];
  selected?: string;
  onSelect: (id: string, label: string) => void;
}) {
  const [expandedRoot, setExpandedRoot] = useState<string | null>(null);

  return (
    <div className="mt-5 space-y-2">
      {tree.map((root) => {
        const hasChildren = root.children && root.children.length > 0;
        const isExpanded = expandedRoot === root.id;

        return (
          <div
            key={root.id}
            className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest"
          >
            <button
              type="button"
              onClick={() => {
                if (hasChildren) {
                  setExpandedRoot(isExpanded ? null : root.id);
                } else {
                  onSelect(root.id, root.label);
                }
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-surface-container/40"
            >
              <span className="text-sm font-semibold text-on-surface">
                {root.label}
              </span>
              {hasChildren ? (
                <ChevronDown
                  size={16}
                  strokeWidth={1.8}
                  className={`text-on-surface-variant transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              ) : (
                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  className="text-on-surface-variant"
                />
              )}
            </button>

            {isExpanded && hasChildren && (
              <div className="border-t border-outline-variant/20">
                {/* Select root as "all" */}
                <button
                  type="button"
                  onClick={() => onSelect(root.id, root.label)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-container/40"
                >
                  <span className="text-sm text-on-surface-variant">
                    Toda la categoría &laquo;{root.label}&raquo;
                  </span>
                </button>
                {root.children!.map((child) => {
                  const isActive = selected === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() =>
                        onSelect(child.id, `${root.label} - ${child.label}`)
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-container/40"
                    >
                      <span
                        className={`text-sm ${
                          isActive
                            ? "font-semibold text-primary"
                            : "text-on-surface"
                        }`}
                      >
                        {child.label}
                      </span>
                      {isActive && (
                        <Check
                          size={16}
                          strokeWidth={2.2}
                          className="text-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo Picker
// ─────────────────────────────────────────────────────────────────────────────

function PhotoPicker({
  photos,
  setPhotos,
  showErrors,
  maxPhotos,
}: {
  photos: File[];
  setPhotos: (p: File[]) => void;
  showErrors?: boolean;
  maxPhotos: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [optimizing, setOptimizing] = useState(0);

  const previews = useMemo(
    () => photos.map((f) => URL.createObjectURL(f)),
    [photos],
  );

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = maxPhotos - photos.length;
    if (arr.length === 0 || room <= 0) return;
    const toProcess = arr.slice(0, room);

    // Optimize each picked file (resize to 1600px max side + JPEG q=0.85)
    // before adding it to state. A 12 MP phone photo of ~5 MB comes out
    // ~300–500 KB — well under the backend cap — and the preview shown
    // below is the optimized version, so what the user sees is what gets
    // uploaded.
    setOptimizing(toProcess.length);
    const optimized: File[] = [];
    for (const f of toProcess) {
      try {
        optimized.push(await optimizeImage(f));
      } catch {
        optimized.push(f);
      }
      setOptimizing((n) => Math.max(0, n - 1));
    }
    setPhotos([...photos, ...optimized]);
    setOptimizing(0);
  };

  const removePhoto = (i: number) => {
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-on-surface">
          Fotos <span className="text-red-500">*</span>
        </label>
        <span
          className={`text-xs font-semibold ${
            showErrors && photos.length === 0
              ? "text-red-500"
              : "text-on-surface-variant/60"
          }`}
        >
          {photos.length}/{maxPhotos}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Existing previews */}
        {previews.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 transition hover:bg-black/80"
            >
              <X size={12} strokeWidth={2} className="text-white" />
            </button>
          </div>
        ))}

        {/* Add button / drop zone */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            disabled={optimizing > 0}
            className={`flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition ${
              dragOver
                ? "border-primary bg-primary/10"
                : showErrors && photos.length === 0
                  ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                  : "border-primary/40 bg-primary/5 hover:border-primary/60"
            } disabled:opacity-60`}
          >
            {optimizing > 0 ? (
              <>
                <Spinner size={18} />
                <span className="text-[11px] font-semibold text-primary">
                  Optimizando…
                </span>
              </>
            ) : (
              <>
                <Upload size={20} strokeWidth={1.5} className="text-primary" />
                <span className="text-[11px] font-semibold text-primary">
                  Anadir
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form field primitives
// ─────────────────────────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

const selectCls = `${inputCls} appearance-none cursor-pointer`;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-on-surface">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className={error ? "rounded-xl ring-2 ring-red-400" : ""}>
        {children}
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-lowest px-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container transition hover:bg-surface-container/80"
      >
        <Minus size={14} strokeWidth={2} />
      </button>
      <span className="text-base font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container transition hover:bg-surface-container/80"
      >
        <Plus size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kind-specific forms
// ─────────────────────────────────────────────────────────────────────────────

interface FormProps {
  form: FormState;
  setField: (k: string, v: any) => void;
  showErrors?: boolean;
}

/**
 * Multi-color picker used by MarketPlace + Vehículos. Stores a list of hex
 * strings on `form.colors`. Uses the native `<input type="color">` picker
 * so we don't ship a heavy HSV widget — the user can also type a hex
 * manually. Chips show what's picked and can be removed individually.
 */
function ColorsField({
  form,
  setField,
  hint,
}: {
  form: FormState;
  setField: (k: string, v: any) => void;
  hint?: string;
}) {
  const colors: string[] = Array.isArray(form.colors) ? form.colors : [];
  const [draft, setDraft] = useState<string>("#000000");
  const [hexInput, setHexInput] = useState<string>("");

  const add = (raw: string) => {
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return;
    const upper = withHash.toUpperCase();
    if (colors.includes(upper)) return;
    setField("colors", [...colors, upper]);
    setHexInput("");
  };

  const remove = (idx: number) => {
    const next = colors.filter((_, i) => i !== idx);
    setField("colors", next);
  };

  return (
    <Field label="Colores" >
      {colors.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-lowest py-1 pl-1.5 pr-2 text-xs font-semibold text-on-surface"
            >
              <span
                className="h-5 w-5 rounded-full border border-black/10"
                style={{ backgroundColor: c }}
                aria-hidden
              />
              <span className="tabular-nums">{c}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Quitar ${c}`}
                className="grid h-4 w-4 place-items-center rounded-full text-muted transition hover:bg-danger/15 hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative inline-flex h-10 w-14 cursor-pointer overflow-hidden rounded-lg border border-outline-variant/40">
          <input
            type="color"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
            aria-label="Selector de color"
          />
        </label>
        <button
          type="button"
          onClick={() => add(draft)}
          className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/20"
        >
          + Añadir color
        </button>

        <div className="flex items-center gap-2">
          <input
            value={hexInput}
            onChange={(ev) => setHexInput(ev.target.value.toUpperCase())}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                add(hexInput);
              }
            }}
            placeholder="#RRGGBB"
            maxLength={7}
            className="w-24 rounded-lg border border-outline-variant/40 bg-surface-lowest px-2 py-2 text-xs font-semibold uppercase tabular-nums outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => add(hexInput)}
            className="rounded-lg bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-high"
          >
            Añadir
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-muted">
        {hint ??
          "Puedes añadir varios colores. Ayuda a los compradores a encontrar tu anuncio."}
      </p>
    </Field>
  );
}

function MarketPlaceForm({ form, setField, showErrors: e }: FormProps) {
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <input
          value={form.title ?? ""}
          onChange={(ev) => setField("title", ev.target.value)}
          placeholder="Ej: iPhone 15 Pro 256GB"
          className={inputCls}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <textarea
          value={form.description ?? ""}
          onChange={(ev) => setField("description", ev.target.value)}
          placeholder="Detalles, motivo de venta, garantia..."
          maxLength={500}
          rows={4}
          className={`${inputCls} h-auto resize-none py-3`}
        />
        <p className="mt-1 text-right text-[11px] text-on-surface-variant/60">
          {(form.description ?? "").length}/500
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca">
          <input
            value={form.brand ?? ""}
            onChange={(ev) => setField("brand", ev.target.value)}
            placeholder="iPhone"
            className={inputCls}
          />
        </Field>
        <Field label="Modelo">
          <input
            value={form.model ?? ""}
            onChange={(ev) => setField("model", ev.target.value)}
            placeholder="15 Pro"
            className={inputCls}
          />
        </Field>
      </div>

      <ColorsField form={form} setField={setField} />

      <Field label="Estado" required error={e && !form.condition}>
        <select
          value={form.condition ?? ""}
          onChange={(ev) => setField("condition", ev.target.value)}
          className={selectCls}
        >
          <option value="">Selecciona el estado</option>
          {CONDITIONS_FULL.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (XAF)">
          <input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(ev) => setField("price", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
        <Field label="Descuento (%)">
          <input
            type="number"
            min={0}
            max={99}
            value={form.discount ?? ""}
            onChange={(ev) => setField("discount", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <input
          value={form.city ?? ""}
          onChange={(ev) => setField("city", ev.target.value)}
          placeholder="Ej: Malabo"
          className={inputCls}
        />
      </Field>
    </>
  );
}

function VehiculoForm({ form, setField, showErrors: e }: FormProps) {
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <input
          value={form.title ?? ""}
          onChange={(ev) => setField("title", ev.target.value)}
          placeholder="Ej: Toyota Hilux 2020 4x4"
          className={inputCls}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <textarea
          value={form.description ?? ""}
          onChange={(ev) => setField("description", ev.target.value)}
          placeholder="Kilometraje, mantenimiento, equipamiento..."
          maxLength={500}
          rows={4}
          className={`${inputCls} h-auto resize-none py-3`}
        />
        <p className="mt-1 text-right text-[11px] text-on-surface-variant/60">
          {(form.description ?? "").length}/500
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Operación">
          <select
            value={form.operation ?? ""}
            onChange={(ev) => setField("operation", ev.target.value)}
            className={selectCls}
          >
            <option value="">Venta o alquiler</option>
            {PROPERTY_OPERATIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" required error={e && !form.condition}>
          <select
            value={form.condition ?? ""}
            onChange={(ev) => setField("condition", ev.target.value)}
            className={selectCls}
          >
            <option value="">Estado</option>
            {CONDITIONS_VEHICLE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca">
          <input
            value={form.brand ?? ""}
            onChange={(ev) => setField("brand", ev.target.value)}
            placeholder="Toyota"
            className={inputCls}
          />
        </Field>
        <Field label="Modelo">
          <input
            value={form.model ?? ""}
            onChange={(ev) => setField("model", ev.target.value)}
            placeholder="Hilux"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Año">
          <input
            type="number"
            min={1900}
            max={2099}
            value={form.year ?? ""}
            onChange={(ev) => setField("year", ev.target.value)}
            placeholder="2020"
            className={inputCls}
          />
        </Field>
        <Field label="Kilometraje">
          <input
            type="number"
            min={0}
            value={form.kilometrage ?? ""}
            onChange={(ev) => setField("kilometrage", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cambio" required error={e && !form.transmission}>
          <select
            value={form.transmission ?? ""}
            onChange={(ev) => setField("transmission", ev.target.value)}
            className={selectCls}
          >
            <option value="">Tipo</option>
            {TRANSMISSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Motor" required error={e && !form.engine}>
          <select
            value={form.engine ?? ""}
            onChange={(ev) => setField("engine", ev.target.value)}
            className={selectCls}
          >
            <option value="">Tipo</option>
            {ENGINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ColorsField
        form={form}
        setField={setField}
        hint="Añade los colores del vehículo (carrocería, tapicería…)."
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (XAF)">
          <input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(ev) => setField("price", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
        <Field label="Descuento (%)">
          <input
            type="number"
            min={0}
            max={99}
            value={form.discount ?? ""}
            onChange={(ev) => setField("discount", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <input
          value={form.city ?? ""}
          onChange={(ev) => setField("city", ev.target.value)}
          placeholder="Ej: Malabo"
          className={inputCls}
        />
      </Field>
    </>
  );
}

function ServicioForm({ form, setField, showErrors: e }: FormProps) {
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <input
          value={form.title ?? ""}
          onChange={(ev) => setField("title", ev.target.value)}
          placeholder="Ej: Electricista a domicilio"
          className={inputCls}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <textarea
          value={form.description ?? ""}
          onChange={(ev) => setField("description", ev.target.value)}
          placeholder="Experiencia, horarios, que incluye el servicio..."
          maxLength={500}
          rows={4}
          className={`${inputCls} h-auto resize-none py-3`}
        />
        <p className="mt-1 text-right text-[11px] text-on-surface-variant/60">
          {(form.description ?? "").length}/500
        </p>
      </Field>

      <Field label="Modalidad" required error={e && !form.offerType}>
        <select
          value={form.offerType ?? ""}
          onChange={(ev) => setField("offerType", ev.target.value)}
          className={selectCls}
        >
          <option value="">Buscas u ofreces?</option>
          {SERVICE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (XAF)">
          <input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(ev) => setField("price", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
        <Field label="Descuento (%)">
          <input
            type="number"
            min={0}
            max={99}
            value={form.discount ?? ""}
            onChange={(ev) => setField("discount", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <input
          value={form.city ?? ""}
          onChange={(ev) => setField("city", ev.target.value)}
          placeholder="Ej: Malabo"
          className={inputCls}
        />
      </Field>
    </>
  );
}

function InmobiliariaForm({ form, setField, showErrors: e }: FormProps) {
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <input
          value={form.title ?? ""}
          onChange={(ev) => setField("title", ev.target.value)}
          placeholder="Ej: Piso 3 hab. centro Malabo"
          className={inputCls}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <textarea
          value={form.description ?? ""}
          onChange={(ev) => setField("description", ev.target.value)}
          placeholder="Superficie, planta, año, características..."
          maxLength={500}
          rows={4}
          className={`${inputCls} h-auto resize-none py-3`}
        />
        <p className="mt-1 text-right text-[11px] text-on-surface-variant/60">
          {(form.description ?? "").length}/500
        </p>
      </Field>

      <Field label="Operación">
        <select
          value={form.operation ?? ""}
          onChange={(ev) => setField("operation", ev.target.value)}
          className={selectCls}
        >
          <option value="">Venta o alquiler</option>
          {PROPERTY_OPERATIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Estado" required error={e && !form.condition}>
        <select
          value={form.condition ?? ""}
          onChange={(ev) => setField("condition", ev.target.value)}
          className={selectCls}
        >
          <option value="">Selecciona el estado</option>
          {PROPERTY_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Habitaciones"
          required
          error={e && (!form.bedrooms || form.bedrooms <= 0)}
        >
          <Stepper
            value={form.bedrooms ?? 0}
            onChange={(v) => setField("bedrooms", v)}
          />
        </Field>
        <Field label="Baños">
          <Stepper
            value={form.bathrooms ?? 0}
            onChange={(v) => setField("bathrooms", v)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Planta">
          <Stepper
            value={form.floor ?? 0}
            onChange={(v) => setField("floor", v)}
          />
        </Field>
        <Field label="Superficie (m2)">
          <input
            type="number"
            min={0}
            value={form.surface ?? ""}
            onChange={(ev) => setField("surface", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (XAF)">
          <input
            type="number"
            min={0}
            value={form.price ?? ""}
            onChange={(ev) => setField("price", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
        <Field label="Descuento (%)">
          <input
            type="number"
            min={0}
            max={99}
            value={form.discount ?? ""}
            onChange={(ev) => setField("discount", ev.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Direccion" required error={e && !form.address}>
        <input
          value={form.address ?? ""}
          onChange={(ev) => setField("address", ev.target.value)}
          placeholder="Calle, barrio, referencia"
          className={inputCls}
        />
      </Field>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <input
          value={form.city ?? ""}
          onChange={(ev) => setField("city", ev.target.value)}
          placeholder="Ej: Malabo"
          className={inputCls}
        />
      </Field>
    </>
  );
}

function EmpleoForm({ form, setField, showErrors: e }: FormProps) {
  return (
    <>
      <Field label="Título" required error={e && !form.title}>
        <input
          value={form.title ?? ""}
          onChange={(ev) => setField("title", ev.target.value)}
          placeholder="Ej: Camarero/a a media jornada"
          className={inputCls}
        />
      </Field>

      <Field label="Descripción" required error={e && !form.description}>
        <textarea
          value={form.description ?? ""}
          onChange={(ev) => setField("description", ev.target.value)}
          placeholder="Requisitos, salario, horarios, contacto..."
          maxLength={500}
          rows={4}
          className={`${inputCls} h-auto resize-none py-3`}
        />
        <p className="mt-1 text-right text-[11px] text-on-surface-variant/60">
          {(form.description ?? "").length}/500
        </p>
      </Field>

      <Field label="Enlace web">
        <input
          type="url"
          value={form.link ?? ""}
          onChange={(ev) => setField("link", ev.target.value)}
          placeholder="Ej: https://eglng.com/es/careers"
          className={inputCls}
        />
      </Field>

      <Field label="Ubicación (Ciudad)" required error={e && !form.city}>
        <input
          value={form.city ?? ""}
          onChange={(ev) => setField("city", ev.target.value)}
          placeholder="Ej: Malabo"
          className={inputCls}
        />
      </Field>
    </>
  );
}
