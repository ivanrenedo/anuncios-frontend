"use client";

import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ADMIN_ME, GET_ROLES } from "@/graphql/queries";
import { UPDATE_USER } from "@/graphql/mutations";
import { useRouter } from "next/navigation";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import UserActivity from "@/components/admin/UserActivity";
import { resolveImage, UPLOAD_URL } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { MapPin, BadgeCheck, Mail, Phone, Pencil, Settings, Lock } from "lucide-react";
import Spinner from "@/components/Spinner";
import Skeleton from "@/components/Skeleton";
import ChangePinModal from "@/components/admin/ChangePinModal";
import { getErrorMessage } from "@/lib/errors";

const LANGUAGES: Record<string, string> = {
  es: "Español",
  /* en: "English",
  fr: "Français",
  pt: "Português", */
};

export default function AdminProfile() {
  const { data, loading, refetch } = useQuery(ADMIN_ME) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const me = data?.me;

  const { data: rolesData } = useQuery(GET_ROLES) as { data: any };
  const router = useRouter();

  const [updateUser, { loading: saving }] = useMutation(UPDATE_USER);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    avatarUrl: "",
    coverUrl: "",
    bio: "",
  });
  const [uploading, setUploading] = useState<"avatarUrl" | "coverUrl" | null>(null);
  const [error, setError] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState("");

  const roleLabel =
    (rolesData?.roles ?? []).find((r: any) => r.id === me?.rolId)?.label ?? null;

  const openEdit = () => {
    setForm({
      name: me?.name ?? "",
      email: me?.email ?? "",
      location: me?.location ?? "",
      avatarUrl: me?.avatarUrl ?? "",
      coverUrl: me?.coverUrl ?? "",
      bio: me?.bio ?? "",
    });
    setError("");
    setEditOpen(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${UPLOAD_URL}/image`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("No se pudo subir la imagen");
    const json = await res.json();
    return json.url as string;
  };

  const onPick =
    (field: "avatarUrl" | "coverUrl") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(field);
      setError("");
      try {
        const url = await uploadImage(file);
        setForm((f) => ({ ...f, [field]: url }));
      } catch (err) {
        setError(getErrorMessage(err, "No se pudo subir la imagen"));
      } finally {
        setUploading(null);
        e.target.value = "";
      }
    };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("El nombre y el email son obligatorios.");
      return;
    }
    setError("");
    try {
      await updateUser({
        variables: {
          input: {
            name: form.name.trim(),
            email: form.email.trim(),
            location: form.location.trim() || null,
            avatarUrl: form.avatarUrl || null,
            coverUrl: form.coverUrl || null,
            bio: form.bio.trim() || null,
          },
        },
      });
      setEditOpen(false);
      refetch();
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar el perfil."));
    }
  };

  const saveSetting = async (field: string, value: any) => {
    setSavingField(field);
    setSettingsError("");
    try {
      await updateUser({ variables: { input: { [field]: value } } });
    } catch (e) {
      setSettingsError(getErrorMessage(e, "No se pudo guardar el ajuste."));
    } finally {
      setSavingField(null);
    }
  };

  if (loading && !me) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }
  if (!me) {
    return <p className="text-muted">No se pudo cargar el perfil.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-on-surface">Mi perfil</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPinModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            <Lock size={16} /> Cambiar PIN
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            <Settings size={16} /> Ajustes
          </button>
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <Pencil size={16} /> Editar perfil
          </button>
        </div>
      </div>

      {/* Cabecera: portada + avatar */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest shadow-soft">
        <div className="h-32 bg-gradient-to-br from-gray-900 via-gray-800 to-[#004940]">
          {me.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImage(me.coverUrl)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImage(me.avatarUrl)}
                alt=""
                className="h-24 w-24 rounded-2xl border-4 border-surface-lowest object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-surface-lowest bg-primary/15 text-3xl font-extrabold text-primary">
                {me.name?.charAt(0)}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {roleLabel && <Badge variant="verified">{roleLabel}</Badge>}
              <Badge variant={me.permission === "GRANTED" ? "active" : "draft"}>
                {me.permission === "GRANTED" ? "Acceso concedido" : "Acceso denegado"}
              </Badge>
              {me.verified && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <BadgeCheck size={18} />
                  <span className="text-xs font-semibold">Verificado</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-extrabold text-on-surface">{me.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <Mail size={14} /> {me.email}
              </span>
              {me.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={14} /> {me.phone}
                </span>
              )}
              {me.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {me.location}
                </span>
              )}
              <span>Miembro desde {formatDate(me.createdAt)}</span>
            </div>
            {me.bio && (
              <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">{me.bio}</p>
            )}
          </div>
        </div>
      </div>

      <UserActivity
        userId={me.id}
        onOpenUser={(uid) => router.push(`/admin/users/${uid}`)}
      />

      {/* Editar perfil */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil">
        <div className="space-y-4">
          {/* Portada */}
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Portada</label>
            <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-[#004940]">
              {form.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveImage(form.coverUrl)} alt="" className="h-full w-full object-cover" />
              )}
              <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-lowest/90 px-3 py-1.5 text-xs font-medium hover:bg-surface-lowest">
                {uploading === "coverUrl" && <Spinner size={12} />}
                {uploading === "coverUrl" ? "Subiendo…" : "Cambiar portada"}
                <input type="file" accept="image/*" hidden onChange={onPick("coverUrl")} />
              </label>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImage(form.avatarUrl)} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-xl font-extrabold text-primary">
                {form.name?.charAt(0) || "?"}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-outline-variant/50 px-3 py-2 text-sm font-medium hover:bg-surface-container">
              {uploading === "avatarUrl" && <Spinner size={14} />}
              {uploading === "avatarUrl" ? "Subiendo…" : "Cambiar foto"}
              <input type="file" accept="image/*" hidden onChange={onPick("avatarUrl")} />
            </label>
          </div>

          <Field label="Nombre">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full rounded-xl border border-outline-variant/50 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 w-full rounded-xl border border-outline-variant/50 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Ubicación">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Malabo"
              className="h-10 w-full rounded-xl border border-outline-variant/50 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={300}
              placeholder="Cuéntanos sobre ti…"
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || uploading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              {saving && <Spinner size={15} />}
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cambiar PIN */}
      <ChangePinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />

      {/* Ajustes */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Ajustes">
        <div className="space-y-6">
          {settingsError && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{settingsError}</p>
          )}

          <SettingsSection title="Notificaciones">
            <ToggleRow
              label="Ofertas y precios"
              description="Bajadas de precio en tus favoritos"
              checked={!!me.notifOffers}
              loading={savingField === "notifOffers"}
              onChange={(v) => saveSetting("notifOffers", v)}
            />
            <ToggleRow
              label="Marketing"
              description="Novedades, promociones y boletines"
              checked={!!me.notifMarketing}
              loading={savingField === "notifMarketing"}
              onChange={(v) => saveSetting("notifMarketing", v)}
            />
          </SettingsSection>

          <SettingsSection title="Privacidad">
            <ToggleRow
              label="Mostrar email"
              description="Visible en tu perfil público"
              checked={!!me.showEmail}
              loading={savingField === "showEmail"}
              onChange={(v) => saveSetting("showEmail", v)}
            />
            <ToggleRow
              label="Mostrar teléfono"
              description="Permitir que otros vean tu número"
              checked={!!me.showPhone}
              loading={savingField === "showPhone"}
              onChange={(v) => saveSetting("showPhone", v)}
            />
          </SettingsSection>

          <SettingsSection title="Preferencias">
            <SelectRow
              label="Idioma"
              value={me.language ?? "es"}
              options={Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))}
              loading={savingField === "language"}
              onChange={(v) => saveSetting("language", v)}
            />
         
          </SettingsSection>

          <p className="text-center text-xs text-muted">Market EG · Panel admin</p>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="divide-y divide-outline-variant/30 rounded-xl border border-outline-variant/30 px-4">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  loading,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3${loading ? " opacity-60 pointer-events-none" : ""}`}>
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      {loading ? (
        <Spinner size={18} />
      ) : (
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            checked ? "bg-primary" : "bg-outline-variant/60"
          }`}
          aria-pressed={checked}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface-lowest shadow transition-all ${
              checked ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      )}
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  loading?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3${loading ? " opacity-60 pointer-events-none" : ""}`}>
      <p className="text-sm font-medium text-on-surface">{label}</p>
      <div className="flex items-center gap-2">
        {loading && <Spinner size={14} />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
