"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Flag, X, CheckCircle2 } from "lucide-react";
import { CREATE_REPORT } from "@/graphql/mutations";
import { getErrorMessage } from "@/lib/errors";
import Spinner from "@/components/Spinner";

type ReportType = "product" | "user";

const REASONS: Record<ReportType, { value: string; label: string }[]> = {
  product: [
    { value: "spam", label: "Spam o engañoso" },
    { value: "scam", label: "Estafa o fraude" },
    { value: "prohibited", label: "Anuncio prohibido o ilegal" },
    { value: "offensive", label: "Contenido ofensivo" },
    { value: "other", label: "Otro" },
  ],
  user: [
    { value: "scam", label: "Estafa o fraude" },
    { value: "harassment", label: "Acoso o abuso" },
    { value: "fake", label: "Perfil falso o suplantación" },
    { value: "offensive", label: "Contenido ofensivo" },
    { value: "other", label: "Otro" },
  ],
};

export default function ReportModal({
  open,
  onClose,
  type,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
  targetLabel?: string;
}) {
  const [createReport, { loading }] = useMutation(CREATE_REPORT);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setError("");
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!reason) {
      setError("Selecciona un motivo.");
      return;
    }
    setError("");
    try {
      await createReport({
        variables: {
          input: {
            type,
            reason,
            description: description.trim() || null,
            ...(type === "product"
              ? { productId: targetId }
              : { reportedUserId: targetId }),
          },
        },
      });
      setSuccess(true);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo enviar el reporte."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-lowest p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-lg font-bold text-on-surface">Reporte enviado</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Gracias por ayudarnos a mantener Bomell seguro. Nuestro equipo lo
              revisará.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-danger-soft text-danger">
                  <Flag size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    {type === "product" ? "Reportar anuncio" : "Reportar usuario"}
                  </h3>
                  {targetLabel && (
                    <p className="max-w-[260px] truncate text-xs text-muted">
                      {targetLabel}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-container"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-2 text-sm font-medium text-on-surface">Motivo</p>
            <div className="space-y-2">
              {REASONS[type].map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                    reason === r.value
                      ? "border-primary bg-primary/5 text-on-surface"
                      : "border-outline-variant/50 text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-primary"
                  />
                  {r.label}
                </label>
              ))}
            </div>

            <p className="mb-1.5 mt-4 text-sm font-medium text-on-surface">
              Detalles (opcional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos qué ha pasado…"
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Spinner size={15} />}
                {loading ? "Enviando…" : "Enviar reporte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
