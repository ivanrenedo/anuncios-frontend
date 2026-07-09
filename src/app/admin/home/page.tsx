"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GripVertical, Plus, Pencil, Trash2, Eye, EyeOff,
  Flame, Clock, Tag, Star, TrendingUp, Heart, Image,
  LayoutGrid, Sparkles, BarChart3, Play, ArrowUp, ArrowDown, ImagePlus,
  Crown,
} from "lucide-react";
import {
  GET_ADMIN_HOME_SECTIONS,
  GET_HOME_SUGGESTIONS,
  GET_HOME_SECTION_STATS,
  PREVIEW_FILTER_COUNT,
} from "@/graphql/queries";
import {
  CREATE_HOME_SECTION,
  UPDATE_HOME_SECTION,
  DELETE_HOME_SECTION,
  REORDER_HOME_SECTIONS,
  ACCEPT_HOME_SUGGESTION,
  DISMISS_HOME_SUGGESTION,
  RUN_STATS_ANALYZER,
} from "@/graphql/mutations";
import Modal from "@/components/admin/Modal";
import Badge from "@/components/admin/Badge";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { resolveImage, UPLOAD_URL } from "@/lib/config";

interface HomeSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  filter?: any;
  config?: any;
  sortOrder: number;
  visible: boolean;
  notifyOnCreate: boolean;
  minResults: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

type SlideLinkType = "none" | "product" | "category" | "url";

interface BannerSlide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonTextColor: string;
  image: string;
  linkType: SlideLinkType;
  linkValue: string;
}

const LINK_TYPE_OPTIONS: { value: SlideLinkType; label: string }[] = [
  { value: "none", label: "Sin acción" },
  { value: "product", label: "Producto específico" },
  { value: "category", label: "Categoría / búsqueda" },
  { value: "url", label: "URL externa" },
];

const LINK_VALUE_PLACEHOLDER: Record<SlideLinkType, string> = {
  none: "",
  product: "ID del producto",
  category: "Categoría (ej. Electrónica)",
  url: "https://...",
};

interface HomeSuggestion {
  id: string;
  type: string;
  title: string;
  reason: string;
  filter: any;
  score: number;
  status: string;
  createdAt: string;
}

interface SectionStats {
  sectionId: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

const ICON_MAP: Record<string, any> = {
  flame: Flame, clock: Clock, tag: Tag, star: Star,
  "trending-up": TrendingUp, heart: Heart, image: Image,
  "layout-grid": LayoutGrid,crown: Crown
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

const TYPE_OPTIONS = [
  { value: "product_rail", label: "Rail de productos" },
  { value: "product_grid", label: "Grid de productos" },
  { value: "banner", label: "Banner" },
  { value: "categories", label: "Categorías" },
  { value: "recent_views", label: "Vistos recientemente" },
];

const SORT_OPTIONS = [
  { value: "views", label: "Vistas" },
  { value: "favoritesCount", label: "Favoritos" },
  { value: "createdAt", label: "Fecha de creación" },
  { value: "discount", label: "Descuento" },
  { value: "price", label: "Precio" },
];

const TIME_OPTIONS = [
  { value: "", label: "Sin límite" },
  { value: "24h", label: "Últimas 24 horas" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
];

const EMPTY_FORM = {
  type: "product_rail",
  title: "",
  subtitle: "",
  icon: "star",
  sortBy: "createdAt",
  order: "desc" as "asc" | "desc",
  limit: 10,
  timeRange: "",
  categorySlug: "",
  city: "",
  minDiscount: 0,
  visible: true,
  notifyOnCreate: false,
  minResults: 0,
  startsAt: "",
  endsAt: "",
  slides: [] as BannerSlide[],
  autoplay: false,
  autoplayMs: 3500,
};

function newSlide(): BannerSlide {
  return {
    id: `slide_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    badge: "PROMO",
    badgeColor: "#006b5e",
    title: "",
    subtitle: "",
    buttonLabel: "Ver más",
    buttonTextColor: "#006b5e",
    image: "",
    linkType: "none",
    linkValue: "",
  };
}

function getIcon(name?: string | null) {
  const Icon = ICON_MAP[name ?? ""] ?? Star;
  return Icon;
}

export default function AdminHomePage() {
  const { data, loading, refetch } = useQuery(GET_ADMIN_HOME_SECTIONS);
  const { data: sugData, refetch: refetchSuggestions } = useQuery(GET_HOME_SUGGESTIONS);
  const { data: statsData } = useQuery(GET_HOME_SECTION_STATS);

  const [createSection] = useMutation(CREATE_HOME_SECTION);
  const [updateSection] = useMutation(UPDATE_HOME_SECTION);
  const [deleteSection] = useMutation(DELETE_HOME_SECTION);
  const [reorderSections] = useMutation(REORDER_HOME_SECTIONS);
  const [acceptSuggestion] = useMutation(ACCEPT_HOME_SUGGESTION);
  const [dismissSuggestion] = useMutation(DISMISS_HOME_SUGGESTION);
  const [runAnalyzer, { loading: analyzing }] = useMutation(RUN_STATS_ANALYZER);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);

  const sections: HomeSection[] = (data as any)?.adminHomeSections ?? [];
  const suggestions: HomeSuggestion[] = (sugData as any)?.homeSuggestions ?? [];
  const stats: SectionStats[] = (statsData as any)?.homeSectionStats ?? [];
  const statsMap = new Map(stats.map((s) => [s.sectionId, s]));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (s: HomeSection) => {
    const f = s.filter ?? {};
    setForm({
      type: s.type,
      title: s.title,
      subtitle: s.subtitle ?? "",
      icon: s.icon ?? "star",
      sortBy: f.sortBy ?? "createdAt",
      order: f.order ?? "desc",
      limit: f.limit ?? 10,
      timeRange: f.timeRange ?? "",
      categorySlug: f.categorySlug ?? "",
      city: f.city ?? "",
      minDiscount: f.where?.discount?.gte ?? 0,
      visible: s.visible,
      notifyOnCreate: s.notifyOnCreate,
      minResults: s.minResults,
      startsAt: s.startsAt ? s.startsAt.slice(0, 16) : "",
      endsAt: s.endsAt ? s.endsAt.slice(0, 16) : "",
      slides: ((s.config?.slides as any[] | undefined) ?? []).map((sl) => ({
        linkType: "none" as SlideLinkType,
        linkValue: "",
        ...sl,
      })),
      autoplay: s.config?.autoplay ?? false,
      autoplayMs: s.config?.autoplayMs ?? 3500,
    });
    setEditingId(s.id);
    setError("");
    setModalOpen(true);
  };

  const addSlide = () => setForm((f) => ({ ...f, slides: [...f.slides, newSlide()] }));

  const removeSlide = (id: string) =>
    setForm((f) => ({ ...f, slides: f.slides.filter((sl) => sl.id !== id) }));

  const updateSlide = (id: string, patch: Partial<BannerSlide>) =>
    setForm((f) => ({
      ...f,
      slides: f.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
    }));

  const moveSlide = (id: string, dir: -1 | 1) =>
    setForm((f) => {
      const idx = f.slides.findIndex((sl) => sl.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= f.slides.length) return f;
      const slides = [...f.slides];
      [slides[idx], slides[target]] = [slides[target], slides[idx]];
      return { ...f, slides };
    });

  const uploadSlideImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${UPLOAD_URL}/image`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("No se pudo subir la imagen");
    const json = await res.json();
    return json.url as string;
  };

  const onPickSlideImage =
    (id: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingSlideId(id);
      setError("");
      try {
        const url = await uploadSlideImage(file);
        updateSlide(id, { image: url });
      } catch (err) {
        setError(getErrorMessage(err, "No se pudo subir la imagen"));
      } finally {
        setUploadingSlideId(null);
        e.target.value = "";
      }
    };

  const buildInput = () => {
    const filter: any = {
      sortBy: form.sortBy,
      order: form.order,
      limit: form.limit,
    };
    if (form.timeRange) filter.timeRange = form.timeRange;
    if (form.categorySlug) filter.categorySlug = form.categorySlug;
    if (form.city) filter.city = form.city;
    if (form.minDiscount > 0) filter.where = { discount: { gte: form.minDiscount } };

    const input: any = {
      type: form.type,
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      icon: form.icon || null,
      visible: form.visible,
      notifyOnCreate: form.notifyOnCreate,
      minResults: form.minResults,
    };
    if (showFilter) input.filter = filter;
    if (form.type === "banner") {
      input.config = {
        slides: form.slides.map(
          ({
            id, badge, badgeColor, title, subtitle, buttonLabel, buttonTextColor, image,
            linkType, linkValue,
          }) => ({
            id, badge, badgeColor, title, subtitle, buttonLabel, buttonTextColor, image,
            linkType, linkValue: linkValue.trim(),
          }),
        ),
      };
    } else if (form.type === "product_rail") {
      input.config = { autoplay: form.autoplay, autoplayMs: form.autoplayMs };
    }
    if (form.startsAt) input.startsAt = new Date(form.startsAt).toISOString();
    if (form.endsAt) input.endsAt = new Date(form.endsAt).toISOString();

    return input;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      const input = buildInput();
      if (editingId) {
        await updateSection({ variables: { id: editingId, input } });
      } else {
        await createSection({ variables: { input } });
      }
      await refetch();
      setModalOpen(false);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar la sección."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sección del home?")) return;
    try {
      await deleteSection({ variables: { id } });
      await refetch();
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo eliminar."));
    }
  };

  const handleToggle = async (s: HomeSection) => {
    try {
      await updateSection({ variables: { id: s.id, input: { visible: !s.visible } } });
      await refetch();
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo actualizar."));
    }
  };

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    const ids = sections.map((s) => s.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(targetIdx, 0, moved);
    setDragIdx(null);
    try {
      await reorderSections({ variables: { ids } });
      await refetch();
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo reordenar."));
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptSuggestion({ variables: { id } });
      await Promise.all([refetch(), refetchSuggestions()]);
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo aceptar."));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissSuggestion({ variables: { id } });
      await refetchSuggestions();
    } catch (e) {
      alert(getErrorMessage(e, "No se pudo descartar."));
    }
  };

  const handleRunAnalyzer = async () => {
    try {
      const res = await runAnalyzer();
      const count = (res.data as any)?.runStatsAnalyzer ?? 0;
      await refetchSuggestions();
      alert(`Análisis completado: ${count} sugerencia(s) generada(s).`);
    } catch (e) {
      alert(getErrorMessage(e, "Error al ejecutar el análisis."));
    }
  };

  const showFilter = form.type === "product_rail" || form.type === "product_grid";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Secciones del home</h1>
          <p className="mt-1 text-sm text-muted">
            {sections.length} secciones · {sections.filter((s) => s.visible).length} visibles
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary"
        >
          <Plus size={16} /> Nueva sección
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={40} /></div>
      ) : (
        <div className="space-y-2">
          {sections.map((s, i) => {
            const Icon = getIcon(s.icon);
            const stat = statsMap.get(s.id);
            return (
              <div
                key={s.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  s.visible
                    ? "border-outline-variant/40 bg-surface-lowest"
                    : "border-outline-variant/20 bg-surface-low opacity-50"
                }`}
              >
                <GripVertical size={18} className="shrink-0 cursor-grab text-muted" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{s.title}</p>
                  <p className="truncate text-xs text-muted">
                    {s.type}
                    {s.startsAt && ` · desde ${formatDate(s.startsAt)}`}
                    {s.endsAt && ` · hasta ${formatDate(s.endsAt)}`}
                  </p>
                </div>
                {stat && (
                  <span className="hidden items-center gap-1 text-xs text-muted sm:flex" title="Impresiones / Clicks / CTR">
                    <BarChart3 size={13} /> {stat.impressions} / {stat.clicks} ({stat.ctr.toFixed(1)}%)
                  </span>
                )}
                <Badge variant={s.visible ? "active" : "sold"}>
                  {s.visible ? "Visible" : "Oculta"}
                </Badge>
                <button onClick={() => handleToggle(s)} className="rounded-lg p-1.5 text-muted transition hover:bg-surface-container" title={s.visible ? "Ocultar" : "Mostrar"}>
                  {s.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-muted transition hover:bg-surface-container" title="Editar">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {sections.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">
              No hay secciones configuradas. Crea la primera.
            </p>
          )}
        </div>
      )}

      {/* Sugerencias inteligentes */}
      <div className="mt-10 border-t border-outline-variant/30 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-500" />
            <h2 className="text-lg font-bold text-on-surface">Sugerencias inteligentes</h2>
            <Badge variant="verified">{suggestions.length}</Badge>
          </div>
          <button
            onClick={handleRunAnalyzer}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/50 px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-container disabled:opacity-50"
          >
            {analyzing ? <Spinner size={14} /> : <Play size={14} />} Analizar stats
          </button>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted">No hay sugerencias pendientes. Ejecuta el análisis.</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((sg) => (
              <div
                key={sg.id}
                className="flex items-center gap-3 rounded-xl border border-primary/30 border-l-4 border-l-primary bg-surface-lowest px-4 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{sg.title}</p>
                  <p className="truncate text-xs text-primary/80">
                    <BarChart3 size={12} className="mr-1 inline" />
                    {sg.reason}
                  </p>
                </div>
                <div className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container" title={`Score: ${(sg.score * 100).toFixed(0)}%`}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${sg.score * 100}%` }} />
                </div>
                <button
                  onClick={() => handleAccept(sg.id)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
                >
                  Agregar
                </button>
                <button
                  onClick={() => handleDismiss(sg.id)}
                  className="rounded-lg border border-outline-variant/50 px-3 py-1.5 text-xs font-medium text-muted"
                >
                  Ignorar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar sección" : "Nueva sección"}
        wide={form.type === "banner"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Subtítulo</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Icono</label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
              >
                {ICON_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {showFilter && (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                Configuración del filtro
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Ordenar por</label>
                  <select
                    value={form.sortBy}
                    onChange={(e) => setForm({ ...form, sortBy: e.target.value })}
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Orden</label>
                  <select
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value as "asc" | "desc" })}
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  >
                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Límite</label>
                  <input
                    type="number" min={1} max={30} value={form.limit}
                    onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Rango de tiempo</label>
                  <select
                    value={form.timeRange}
                    onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  >
                    {TIME_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Categoría (slug)</label>
                  <input
                    value={form.categorySlug}
                    onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
                    placeholder="electronica"
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Ciudad</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Malabo"
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">Descuento mín. (%)</label>
                  <input
                    type="number" min={0} max={100} value={form.minDiscount}
                    onChange={(e) => setForm({ ...form, minDiscount: Number(e.target.value) })}
                    className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {form.type === "product_rail" && (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={form.autoplay}
                  onChange={(e) => setForm({ ...form, autoplay: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Desplazamiento automático (auto-play)
              </label>
              {form.autoplay && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-muted">
                    Velocidad (segundos entre avances)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={0.5}
                    value={form.autoplayMs / 1000}
                    onChange={(e) =>
                      setForm({ ...form, autoplayMs: Math.round(Number(e.target.value) * 1000) })
                    }
                    className="h-9 w-32 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {form.type === "banner" && (
            <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Slides del banner
                </p>
                <button
                  type="button"
                  onClick={addSlide}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <Plus size={14} /> Añadir slide
                </button>
              </div>

              {form.slides.length === 0 && (
                <p className="py-4 text-center text-xs text-muted">
                  Sin slides propios: se mostrarán los de ejemplo por defecto en la app.
                </p>
              )}

              <div className="space-y-3">
                {form.slides.map((slide, i) => (
                  <div
                    key={slide.id}
                    className="rounded-lg border border-outline-variant/40 bg-surface-lowest p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">Slide {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSlide(slide.id, -1)}
                          disabled={i === 0}
                          className="rounded p-1 text-muted transition hover:bg-surface-container disabled:opacity-30"
                          title="Subir"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlide(slide.id, 1)}
                          disabled={i === form.slides.length - 1}
                          className="rounded p-1 text-muted transition hover:bg-surface-container disabled:opacity-30"
                          title="Bajar"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(slide.id)}
                          className="rounded p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-outline-variant/60 bg-surface-container">
                        {uploadingSlideId === slide.id ? (
                          <Spinner size={16} />
                        ) : slide.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImage(slide.image)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus size={18} className="text-muted" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onPickSlideImage(slide.id)}
                        />
                      </label>

                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <input
                          value={slide.badge}
                          onChange={(e) => updateSlide(slide.id, { badge: e.target.value })}
                          placeholder="Etiqueta (PROMO)"
                          className="h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none focus:border-primary"
                        />
                        <input
                          type="color"
                          value={slide.badgeColor}
                          onChange={(e) => updateSlide(slide.id, { badgeColor: e.target.value })}
                          className="h-8 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-1"
                          title="Color de la etiqueta"
                        />
                        <input
                          value={slide.title}
                          onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                          placeholder="Título"
                          className="col-span-2 h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none focus:border-primary"
                        />
                        <input
                          value={slide.subtitle}
                          onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })}
                          placeholder="Subtítulo"
                          className="col-span-2 h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none focus:border-primary"
                        />
                        <input
                          value={slide.buttonLabel}
                          onChange={(e) => updateSlide(slide.id, { buttonLabel: e.target.value })}
                          placeholder="Texto del botón"
                          className="h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none focus:border-primary"
                        />
                        <input
                          type="color"
                          value={slide.buttonTextColor}
                          onChange={(e) =>
                            updateSlide(slide.id, { buttonTextColor: e.target.value })
                          }
                          className="h-8 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-1"
                          title="Color del texto del botón"
                        />
                        <select
                          value={slide.linkType}
                          onChange={(e) =>
                            updateSlide(slide.id, {
                              linkType: e.target.value as SlideLinkType,
                              linkValue: "",
                            })
                          }
                          className="h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none"
                        >
                          {LINK_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {slide.linkType !== "none" && (
                          <input
                            value={slide.linkValue}
                            onChange={(e) => updateSlide(slide.id, { linkValue: e.target.value })}
                            placeholder={LINK_VALUE_PLACEHOLDER[slide.linkType]}
                            className="h-8 rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-xs outline-none focus:border-primary"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Activa desde</label>
              <input
                type="datetime-local" value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Activa hasta</label>
              <input
                type="datetime-local" value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Mín. resultados (oculta si hay menos)</label>
            <input
              type="number" min={0} max={30} value={form.minResults}
              onChange={(e) => setForm({ ...form, minResults: Number(e.target.value) })}
              className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
              <input
                type="checkbox" checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Visible en el home
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
              <input
                type="checkbox" checked={form.notifyOnCreate}
                onChange={(e) => setForm({ ...form, notifyOnCreate: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Enviar push notification al crear
              <span className="text-xs text-muted">(usuarios con marketing activo)</span>
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-outline-variant/30 pt-4">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-outline-variant/50 px-4 py-2 text-sm font-medium text-muted"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {saving && <Spinner size={14} />}
              {editingId ? "Guardar cambios" : "Crear sección"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
