"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  X,
  Bell,
  Lock,
  Languages,
  Palette,
  Phone,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DELETE_MY_ACCOUNT } from "@/graphql/mutations";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import { useThemeStore, type ThemeMode } from "@/store/themeStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Consolidates everything that used to be sprinkled across `/edit-profile`
 * (notifications, privacy toggles, language, theme) plus the account actions
 * (change phone, delete account) into a single modal launched from
 * the profile header. Edit-profile keeps only the personal-info fields
 * (name, bio, location, photos, email display, phone change trigger).
 */
export default function SettingsModal({ open, onClose }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, updateProfile } = useProfile();
  // El store de tema aplica el cambio a la shop al instante (toggle de la
  // clase .dark en <html>). Sin él, el select del modal sólo guardaba en BD
  // y el usuario no veía el cambio hasta recargar.
  const themeMode = useThemeStore((s) => s.theme);
  const setThemeMode = useThemeStore((s) => s.setTheme);

  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [language, setLanguage] = useState("es");
  const [themePreference, setThemePreference] = useState<ThemeMode>("system");

  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [error, setError] = useState("");

  const [phoneOpen, setPhoneOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [deleteMyAccount, { loading: deleting }] = useMutation(DELETE_MY_ACCOUNT);

  // Hydrate from profile. Para el tema damos preferencia a lo que el store
  // ya tiene aplicado (persistido en localStorage): así el select refleja
  // exactamente lo que está viendo el usuario, no sólo lo que hay en la BD.
  useEffect(() => {
    if (!profile) return;
    setShowEmail(profile.showEmail ?? false);
    setShowPhone(profile.showPhone ?? false);
    setNotifOffers(profile.notifOffers ?? true);
    setNotifMarketing(profile.notifMarketing ?? false);
    setLanguage(profile.language || "es");
    setThemePreference(
      themeMode || (profile.themePreference as ThemeMode) || "system",
    );
  }, [profile, open, themeMode]);

  // ESC closes; body scroll locked while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        showEmail,
        showPhone,
        notifOffers,
        notifMarketing,
        language,
        themePreference,
      });
      setSavedTick(true);
      window.setTimeout(() => setSavedTick(false), 1600);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteMyAccount();
      if (typeof window !== "undefined") localStorage.clear();
      logout();
      onClose();
      router.push("/");
    } catch {
      alert("Error al eliminar la cuenta. Inténtalo de nuevo.");
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
            <h2
              id="settings-title"
              className="text-lg font-extrabold tracking-tight text-on-surface"
            >
              Ajustes
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-container hover:text-on-surface"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* Notifications */}
            <Section title="Notificaciones" icon={<Bell size={16} />}>
              <Toggle
                label="Ofertas"
                description="Notificaciones sobre ofertas en tus productos"
                checked={notifOffers}
                onChange={setNotifOffers}
              />
              <Toggle
                label="Marketing"
                description="Novedades y promociones de Bomelh"
                checked={notifMarketing}
                onChange={setNotifMarketing}
              />
            </Section>

            {/* Privacy */}
            <Section title="Privacidad" icon={<Lock size={16} />}>
              <Toggle
                label="Mostrar email"
                description="Otros usuarios verán tu email en tu perfil"
                checked={showEmail}
                onChange={setShowEmail}
              />
              <Toggle
                label="Mostrar teléfono"
                description="Otros usuarios verán tu teléfono en tu perfil"
                checked={showPhone}
                onChange={setShowPhone}
              />
            </Section>

            {/* Preferences */}
            <Section title="Preferencias" icon={<Palette size={16} />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <Languages size={13} /> Idioma
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="es">Español</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <Palette size={13} /> Tema
                  </label>
                  <select
                    value={themePreference}
                    onChange={(e) => {
                      const next = e.target.value as ThemeMode;
                      setThemePreference(next);
                      // Aplica el cambio a la shop al instante — no esperamos
                      // al "Guardar" para que se vea el tema.
                      setThemeMode(next);
                    }}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-lowest px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Account */}
            <Section title="Cuenta" icon={<Phone size={16} />}>
              <button
                type="button"
                onClick={() => setPhoneOpen(true)}
                className="flex w-full items-center justify-between rounded-lg bg-surface-container px-4 py-3 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-high"
              >
                <span className="inline-flex items-center gap-2">
                  <Phone size={15} />
                  {user?.phone
                    ? `Cambiar teléfono (${user.phone})`
                    : "Verificar teléfono"}
                </span>
                <span aria-hidden>→</span>
              </button>

            </Section>

            {/* Danger */}
            <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-danger">
                <AlertTriangle size={15} /> Zona peligrosa
              </h4>
              <p className="mt-1 text-xs text-muted">
                Eliminar tu cuenta borra permanentemente tu perfil, tus
                anuncios y todos tus datos. No se puede deshacer.
              </p>
              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:opacity-80"
                >
                  <Trash2 size={14} /> Eliminar cuenta
                </button>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {deleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Confirmar eliminación
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-high"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Sticky footer with save */}
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/30 bg-surface px-5 py-3">
            {savedTick && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Guardado ✓
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-high"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {phoneOpen && (
        <PhoneVerificationModal onClose={() => setPhoneOpen(false)} />
      )}
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
        {icon} {title}
      </h3>
      <div className="space-y-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
        {children}
      </div>
    </section>
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
      <div className="min-w-0">
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
