"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Copy,
  Crown,
  Download,
  Loader2,
  Mail,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import { UPDATE_USER } from "@/graphql/mutations";
import { MY_SELLER_QR_STATS } from "@/graphql/queries";
import { getQrProfileUrl } from "@/lib/config";
import { formatNumber } from "@/lib/format";

interface Props {
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  effectivePlan: string;
  qrShowPhone: boolean;
  qrShowEmail: boolean;
}

const PLAN_META: Record<string, { label: string; icon: ReactNode; classes: string }> = {
  STAR: {
    label: "Star",
    icon: <Star size={12} className="fill-current" strokeWidth={0} />,
    classes: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  PREMIUM: {
    label: "Premium",
    icon: <Crown size={12} />,
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
};

/**
 * v2 (Fase QR) — printable share card for Star/Premium sellers.
 *
 * The card renders inline for previewing, and can be downloaded as a
 * standalone PNG that a seller can print on a business card or a shop poster.
 * The QR encodes the public profile URL with `?src=qr`, which the profile
 * page picks up and reports to the backend for stats.
 *
 * Contact rows (phone/email) are opt-in via `qrShowPhone`/`qrShowEmail`
 * so a shared photo never leaks contact info by default.
 */
export default function QrShareCard({
  userId,
  name,
  phone,
  email,
  effectivePlan,
  qrShowPhone,
  qrShowEmail,
}: Props) {
  const url = useMemo(() => getQrProfileUrl(userId), [userId]);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [updateUser, { loading: savingPrefs }] = useMutation(UPDATE_USER);

  const { data: statsData } = useQuery(MY_SELLER_QR_STATS, {
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const monthlyScans: number = statsData?.mySellerQrStats?.thisMonth ?? 0;

  const planMeta = PLAN_META[effectivePlan] ?? null;
  const hasPhoneRow = qrShowPhone && !!phone;
  const hasEmailRow = qrShowEmail && !!email;

  const setPref = (key: "qrShowPhone" | "qrShowEmail", value: boolean) => {
    void updateUser({
      variables: { input: { [key]: value } },
    }).catch(() => {});
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Best-effort; the URL text is always visible on the card.
    }
  };

  const shareLink = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `Perfil de ${name} en Bomelh`,
          text: `Mira mi tienda en Bomelh: ${name}`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }
    void copyLink();
  };

  const downloadCard = async () => {
    const qr = qrCanvasRef.current;
    if (!qr) return;
    setDownloading(true);
    try {
      const W = 720;
      const H = 1040;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Card background.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, W - 4, H - 4);

      // "Bomelh." wordmark.
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 56px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Bomelh.", W / 2, 110);

      // Seller name.
      ctx.fillStyle = "#111827";
      ctx.font = "700 40px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(name, W / 2, 180);

      // Plan pill (text only — kept simple, matches the pill look).
      if (planMeta) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
        ctx.fillText(planMeta.label.toUpperCase(), W / 2, 220);
      }

      // QR block.
      const qrSize = 460;
      const qrX = (W - qrSize) / 2;
      const qrY = 260;
      ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

      // Contact lines (opt-in).
      let y = qrY + qrSize + 60;
      ctx.font = "500 24px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillStyle = "#374151";
      if (hasPhoneRow) {
        ctx.fillText(phone as string, W / 2, y);
        y += 40;
      }
      if (hasEmailRow) {
        ctx.fillText(email as string, W / 2, y);
        y += 40;
      }

      // Public URL as small print at the bottom.
      ctx.font = "500 20px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, H - 60);

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `tarjeta-qr-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="mx-4 my-6 rounded-2xl border border-outline-variant/40 bg-surface-lowest p-4 sm:mx-6 sm:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Preview card */}
        <div className="flex flex-1 justify-center">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-outline-variant/30 bg-white px-6 py-6 text-slate-900 shadow-sm">
            <p className="text-2xl font-extrabold tracking-tight">Bomelh.</p>
            <p className="text-lg font-bold">{name}</p>
            {planMeta && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${planMeta.classes}`}
              >
                {planMeta.icon}
                {planMeta.label}
              </span>
            )}
            <div className="rounded-lg bg-white p-2">
              <QRCodeCanvas
                value={url}
                size={200}
                includeMargin
                level="M"
                ref={qrCanvasRef as any}
              />
            </div>
            {hasPhoneRow && (
              <p className="inline-flex items-center gap-1 text-sm text-slate-700">
                <Phone size={13} /> {phone}
              </p>
            )}
            {hasEmailRow && (
              <p className="inline-flex items-center gap-1 text-sm text-slate-700">
                <Mail size={13} /> {email}
              </p>
            )}
            <p className="mt-1 break-all text-center text-[11px] font-medium text-slate-500">
              {url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary">
                Tu tarjeta QR
              </h3>
              <p className="mt-1 text-sm text-on-surface">
                Comparte, descarga o imprime este QR — los escaneos suman a tus
                estadísticas.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shareLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-on-primary transition hover:bg-primary/90"
            >
              <Share2 size={15} /> Compartir
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Copy size={15} /> {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <button
              type="button"
              onClick={downloadCard}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Descargar tarjeta
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Datos en tu tarjeta
            </p>
            <div className="mt-2 space-y-2">
              <PrefToggle
                label="Mostrar teléfono"
                description={
                  phone
                    ? "Aparecerá bajo el QR en la tarjeta"
                    : "Añade un teléfono a tu perfil para activarlo"
                }
                checked={qrShowPhone}
                disabled={!phone || savingPrefs}
                onChange={(v) => setPref("qrShowPhone", v)}
              />
              <PrefToggle
                label="Mostrar email"
                description="Aparecerá bajo el QR en la tarjeta"
                checked={qrShowEmail}
                disabled={savingPrefs}
                onChange={(v) => setPref("qrShowEmail", v)}
              />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-on-surface">
            {formatNumber(monthlyScans)} visita
            {monthlyScans === 1 ? "" : "s"} desde tu QR este mes
          </p>
        </div>
      </div>
    </section>
  );
}

function PrefToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 ${
        disabled ? "opacity-60" : "cursor-pointer hover:bg-surface-container"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 cursor-pointer accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
