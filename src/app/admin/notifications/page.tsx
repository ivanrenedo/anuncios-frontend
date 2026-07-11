"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Megaphone, Info, Send, CheckCircle2, ImagePlus, X } from "lucide-react";
import {
  SEND_MARKETING_NOTIFICATION,
  SEND_SYSTEM_NOTIFICATION,
} from "@/graphql/mutations";
import { GET_CATEGORIES, GET_ADMIN_HOME_SECTIONS } from "@/graphql/queries";
import Spinner from "@/components/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { resolveImage, UPLOAD_URL } from "@/lib/config";

type BroadcastType = "marketing" | "system";

const TYPE_OPTIONS: { value: BroadcastType; label: string; desc: string; Icon: typeof Megaphone }[] = [
  {
    value: "marketing",
    label: "Marketing",
    desc: "Promos, campañas y novedades. Solo llega a usuarios con notificaciones de marketing activadas.",
    Icon: Megaphone,
  },
  {
    value: "system",
    label: "Sistema",
    desc: "Mantenimiento, avisos de plataforma. Llega a usuarios con notificaciones de mensajes activadas.",
    Icon: Info,
  },
];

const EMPTY_FORM = {
  type: "marketing" as BroadcastType,
  title: "",
  body: "",
  avatar: "",
  sectionId: "",
  filterCat: "",
  plan: "",
  city: "",
};

export default function AdminNotificationsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ count: number; type: BroadcastType } | null>(null);

  const [sendMarketing] = useMutation(SEND_MARKETING_NOTIFICATION);
  const [sendSystem] = useMutation(SEND_SYSTEM_NOTIFICATION);

  const { data: catData } = useQuery(GET_CATEGORIES);
  const { data: sectionsData } = useQuery(GET_ADMIN_HOME_SECTIONS);

  const categories: { id: string; slug: string; label: string }[] =
    (catData as any)?.categories ?? [];
  const sections: { id: string; title: string; visible: boolean }[] =
    (sectionsData as any)?.adminHomeSections ?? [];

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${UPLOAD_URL}/image`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("No se pudo subir la imagen");
    const json = await res.json();
    return json.url as string;
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, avatar: url }));
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo subir la imagen."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSend = async () => {
    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSending(true);
    setError("");
    setResult(null);
    try {
      const input: any = { title: form.title.trim() };
      if (form.body.trim()) input.body = form.body.trim();
      if (form.avatar.trim()) input.avatar = form.avatar.trim();
      if (form.sectionId) input.sectionId = form.sectionId;
      if (form.filterCat) input.filterCat = form.filterCat;
      if (form.plan) input.plan = form.plan;
      if (form.city.trim()) input.city = form.city.trim();

      const mutation = form.type === "marketing" ? sendMarketing : sendSystem;
      const res = await mutation({ variables: { input } });
      const count =
        (res.data as any)?.sendMarketingNotification ??
        (res.data as any)?.sendSystemNotification ??
        0;

      setResult({ count, type: form.type });
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo enviar la notificación."));
    } finally {
      setSending(false);
    }
  };

  const selected = TYPE_OPTIONS.find((o) => o.value === form.type)!;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Notificaciones</h1>
        <p className="mt-1 text-sm text-muted">
          Envía notificaciones masivas a los usuarios de la plataforma.
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-5">
        {/* Type selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-muted">Tipo de notificación</label>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, type: opt.value })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  form.type === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/40 bg-surface-lowest hover:bg-surface-container"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    form.type === opt.value ? "bg-primary/15 text-primary" : "bg-surface-container text-muted"
                  }`}
                >
                  <opt.Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted leading-snug">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Título <span className="text-danger">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
            placeholder={form.type === "marketing" ? "¡Ofertas de verano!" : "Mantenimiento programado"}
            className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-xs text-muted">{form.title.length}/200</p>
        </div>

        {/* Body */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Mensaje (opcional)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            maxLength={1000}
            rows={3}
            placeholder="Describe el contenido de la notificación..."
            className="w-full resize-none rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-xs text-muted">{form.body.length}/1000</p>
        </div>

        {/* Segmentación de audiencia */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">
            Audiencia (opcional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Todos los planes</option>
              <option value="FREE">Solo Gratis</option>
              <option value="STAR">Solo Estrella</option>
              <option value="PREMIUM">Solo Premium</option>
            </select>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ciudad (ej: Malabo)"
              className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Deja vacío para enviar a todos. Los filtros se combinan (plan Y ciudad).
          </p>
        </div>

        {/* Image upload */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Imagen (opcional)</label>
          <div className="flex items-center gap-3">
            <label className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-outline-variant/60 bg-surface-container transition hover:border-primary">
              {uploading ? (
                <Spinner size={16} />
              ) : form.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImage(form.avatar)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus size={20} className="text-muted" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
            </label>
            {form.avatar && (
              <button
                type="button"
                onClick={() => setForm({ ...form, avatar: "" })}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <X size={12} /> Quitar
              </button>
            )}
            {!form.avatar && !uploading && (
              <p className="text-xs text-muted">Se muestra junto a la notificación en la app.</p>
            )}
          </div>
        </div>

        {/* Deep link fields */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-low p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Deep link (opcional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Sección del home
              </label>
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
              >
                <option value="">Sin sección</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}{!s.visible ? " (oculta)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                Categoría
              </label>
              <select
                value={form.filterCat}
                onChange={(e) => setForm({ ...form, filterCat: e.target.value })}
                className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-2 text-sm outline-none"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Vista previa
          </p>
          <div className="flex items-start gap-3">
            {form.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImage(form.avatar)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                form.type === "marketing" ? "bg-tertiary/15 text-tertiary" : "bg-secondary/15 text-secondary"
              }`}>
                <selected.Icon size={20} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {form.title.trim() || "Título de la notificación"}
              </p>
              {(form.body.trim() || !form.title.trim()) && (
                <p className="mt-0.5 text-xs text-muted">
                  {form.body.trim() || "Cuerpo del mensaje..."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Success */}
        {result && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <CheckCircle2 size={20} className="shrink-0 text-primary" />
            <p className="text-sm text-on-surface">
              Notificación de <strong>{result.type === "marketing" ? "marketing" : "sistema"}</strong>{" "}
              enviada a <strong>{result.count}</strong> usuario{result.count !== 1 && "s"}.
            </p>
          </div>
        )}

        {/* Send button */}
        <div className="flex justify-end border-t border-outline-variant/30 pt-4">
          <button
            onClick={handleSend}
            disabled={sending || !form.title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {sending ? <Spinner size={14} /> : <Send size={14} />}
            {sending ? "Enviando..." : "Enviar notificación"}
          </button>
        </div>
      </div>
    </div>
  );
}
