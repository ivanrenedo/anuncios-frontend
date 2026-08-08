"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  ImageIcon,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/lib/upload";
import { optimizeImage } from "@/lib/imageOptimizer";
import { resolveImage } from "@/lib/config";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import Link from "next/link";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [phoneOpen, setPhoneOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads.
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setAvatarPreview(resolveImage(profile.avatarUrl));
      setCoverPreview(resolveImage(profile.coverUrl));
    }
  }, [profile]);

  /**
   * Persist a single field without going through the form's Guardar button.
   * Used by the auto-save flows below so a user who changes an image or a
   * toggle and then leaves the page doesn't lose the change. Errors surface
   * via `errorMsg`, no reload required.
   */
  const persistField = async (patch: Record<string, unknown>) => {
    try {
      await updateProfile(patch);
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo guardar el cambio.");
    }
  };

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

  // Auto-save avatar: pick → optimize → upload → PATCH avatarUrl. If the
  // upload succeeds but persistence fails, we surface the error and roll the
  // preview back to whatever the server currently has, so UI and server can't
  // drift silently. Same shape as the mobile flow.
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again refires change.
    if (e.target) e.target.value = "";
    if (!file) return;
    setErrorMsg("");
    setUploadingAvatar(true);
    const previousUrl = profile?.avatarUrl || "";
    try {
      const optimized = await optimizeImage(file, {
        maxDim: 800,
        quality: 0.9,
        targetAspect: 1,
      });
      setAvatarPreview(URL.createObjectURL(optimized));
      const url = await uploadImage(optimized);
      await updateProfile({ avatarUrl: url });
      setSuccessMsg("Foto de perfil actualizada.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setAvatarPreview(resolveImage(previousUrl));
      setErrorMsg(err?.message || "No se pudo actualizar la foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setErrorMsg("");
    setUploadingCover(true);
    const previousUrl = profile?.coverUrl || "";
    try {
      const optimized = await optimizeImage(file, {
        maxDim: 1600,
        quality: 0.85,
        targetAspect: 16 / 9,
      });
      setCoverPreview(URL.createObjectURL(optimized));
      const url = await uploadImage(optimized);
      await updateProfile({ coverUrl: url });
      setSuccessMsg("Foto de portada actualizada.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setCoverPreview(resolveImage(previousUrl));
      setErrorMsg(err?.message || "No se pudo actualizar la foto de portada.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Text fields still batch under Guardar so a partial edit doesn't spam
  // the server; images and toggles auto-save above.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
      });
      setSuccessMsg("Perfil actualizado correctamente.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
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
        Actualiza tu información personal. Las preferencias de notificaciones,
        privacidad e idioma están en{" "}
        <span className="font-semibold text-on-surface">Ajustes</span> desde tu
        perfil.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {/* Cover photo */}
        <div>
          <label className="text-sm font-bold text-on-surface">
            Foto de portada
          </label>
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
          <label className="text-sm font-bold text-on-surface">
            Foto de perfil
          </label>
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
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
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
            maxLength={350}
            className="mt-1 w-full resize-none rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Cuéntanos sobre ti..."
          />
          <p className="mt-1 text-xs text-muted">{350 - bio.length} caracteres restantes</p>
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

        {/* Email — read-only. Users can't change it directly; contact support
            (or re-sign-in with a different Google account) if they need to. */}
        <div>
          <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
            <Mail size={14} /> Email
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <Lock size={9} /> No editable
            </span>
          </label>
          <input
            id="email"
            type="email"
            value={profile?.email ?? user?.email ?? ""}
            disabled
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-2.5 text-sm text-muted"
          />
          <p className="mt-1 text-xs text-muted">
            El email está vinculado a tu cuenta. Si necesitas cambiarlo,
            contacta con soporte.
          </p>
        </div>

        {/* Phone — change trigger */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
            <Phone size={14} /> Teléfono
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="tel"
              value={profile?.phone ?? user?.phone ?? ""}
              disabled
              readOnly
              placeholder="Sin teléfono verificado"
              className="w-full cursor-not-allowed rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-2.5 text-sm text-muted"
            />
            <button
              type="button"
              onClick={() => setPhoneOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary/90 sm:whitespace-nowrap"
            >
              <Phone size={14} />
              {user?.phone ? "Cambiar" : "Verificar"}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Necesitarás verificar el nuevo número con un código SMS.
          </p>
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

      {phoneOpen && (
        <PhoneVerificationModal onClose={() => setPhoneOpen(false)} />
      )}
    </div>
  );
}
