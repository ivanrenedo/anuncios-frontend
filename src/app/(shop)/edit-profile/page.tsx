"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  User,
  ImageIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/lib/upload";
import { resolveImage } from "@/lib/config";
import Link from "next/link";

export default function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("es");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [themePreference, setThemePreference] = useState("system");

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setLanguage(profile.language || "es");
      setShowEmail(profile.showEmail ?? false);
      setShowPhone(profile.showPhone ?? false);
      setNotifMessages(profile.notifMessages ?? true);
      setNotifOffers(profile.notifOffers ?? true);
      setNotifMarketing(profile.notifMarketing ?? false);
      setThemePreference(profile.themePreference || "system");
      setAvatarPreview(resolveImage(profile.avatarUrl));
      setCoverPreview(resolveImage(profile.coverUrl));
    }
  }, [profile]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <p className="text-lg font-bold">Editar perfil</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Inicia sesión para editar tu perfil.
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      let avatarUrl = profile?.avatarUrl || undefined;
      let coverUrl = profile?.coverUrl || undefined;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadImage(avatarFile);
        setUploadingAvatar(false);
      }

      // Upload new cover if selected
      if (coverFile) {
        setUploadingCover(true);
        coverUrl = await uploadImage(coverFile);
        setUploadingCover(false);
      }

      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        language,
        showEmail,
        showPhone,
        notifMessages,
        notifOffers,
        notifMarketing,
        themePreference,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(coverUrl !== undefined ? { coverUrl } : {}),
      });

      setAvatarFile(null);
      setCoverFile(null);
      setSuccessMsg("Perfil actualizado correctamente.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setUploadingAvatar(false);
      setUploadingCover(false);
      setErrorMsg(err?.message || "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-on-surface"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h1 className="text-2xl font-extrabold tracking-tight">Editar perfil</h1>
      <p className="mt-1 text-sm text-muted">
        Actualiza tu información personal y preferencias.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {/* Cover photo */}
        <div>
          <label className="text-sm font-bold text-on-surface">Foto de portada</label>
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative mt-2 h-36 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-outline-variant/50 transition hover:border-primary sm:h-48"
          >
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                <ImageIcon size={32} />
                <span className="text-sm">Haz clic para subir</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/30">
              <Camera size={28} className="text-white opacity-0 transition group-hover:opacity-100" />
            </div>
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 size={28} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="text-sm font-bold text-on-surface">Foto de perfil</label>
          <div className="mt-2 flex items-center gap-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-outline-variant/50 transition hover:border-primary"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <User size={28} />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 size={20} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-high"
            >
              Cambiar foto
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="text-sm font-bold text-on-surface">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Tu nombre"
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="text-sm font-bold text-on-surface">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Cuéntanos sobre ti..."
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="text-sm font-bold text-on-surface">
            Ubicación
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Ej: Malabo, Guinea Ecuatorial"
          />
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="text-sm font-bold text-on-surface">
            Idioma
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="es">Español</option>
            <option value="fr">Francés</option>
            <option value="en">Inglés</option>
          </select>
        </div>

        {/* Privacy section */}
        <fieldset className="rounded-2xl border border-outline-variant/30 p-5">
          <legend className="px-2 text-sm font-bold text-on-surface">Privacidad</legend>
          <div className="space-y-4">
            <Toggle
              label="Mostrar email"
              description="Otros usuarios podrán ver tu email en tu perfil"
              checked={showEmail}
              onChange={setShowEmail}
            />
            <Toggle
              label="Mostrar teléfono"
              description="Otros usuarios podrán ver tu teléfono en tu perfil"
              checked={showPhone}
              onChange={setShowPhone}
            />
          </div>
        </fieldset>

        {/* Notifications section */}
        <fieldset className="rounded-2xl border border-outline-variant/30 p-5">
          <legend className="px-2 text-sm font-bold text-on-surface">Notificaciones</legend>
          <div className="space-y-4">
            <Toggle
              label="Mensajes"
              description="Recibir notificaciones de mensajes"
              checked={notifMessages}
              onChange={setNotifMessages}
            />
            <Toggle
              label="Ofertas"
              description="Recibir notificaciones sobre ofertas en tus productos"
              checked={notifOffers}
              onChange={setNotifOffers}
            />
            <Toggle
              label="Marketing"
              description="Recibir novedades y promociones de Market EG"
              checked={notifMarketing}
              onChange={setNotifMarketing}
            />
          </div>
        </fieldset>

        {/* Theme */}
        <div>
          <label htmlFor="theme" className="text-sm font-bold text-on-surface">
            Tema
          </label>
          <select
            id="theme"
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value)}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>

        {/* Success / Error messages */}
        {successMsg && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="rounded-full bg-surface-container px-6 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-high"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-outline-variant/50"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
