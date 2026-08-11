"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { X, Upload, ImageIcon, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { uploadImages } from "@/lib/upload";
import { useRequestVerification } from "@/hooks/useVerification";
import { getErrorMessage } from "@/lib/errors";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const MAX_DOCS = 5;
// v2 Fase 11.4 — solo imágenes. Los PDFs quedaron fuera porque el modal admin
// renderiza thumbnails inline; un formato mixto complica la revisión.
const ACCEPTED = "image/png,image/jpeg,image/webp";

/**
 * v2 Fase 10c — modal para solicitar verificación con documentos.
 *
 * El backend acepta URLs de docs desde Fase 5.2. Este modal:
 *   1) Recibe hasta 5 imágenes/PDFs del usuario
 *   2) Los sube al bucket via uploadImages()
 *   3) Envía requestVerification({ docs: [urls] })
 * El admin los ve en /admin/verifications como thumbnails clicables.
 */
export default function VerificationRequestModal({
  open,
  onClose,
  onSubmitted,
}: Props) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { requestVerification, loading: submitting } = useRequestVerification();

  if (!open) return null;

  const handlePick = () => inputRef.current?.click();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_DOCS - urls.length;
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadImages(files);
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo subir el archivo."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (i: number) => {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    setError("");
    try {
      await requestVerification(urls);
      onSubmitted?.();
      onClose();
      setUrls([]);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-outline-variant/30 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-on-surface">
              Solicitar verificación
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Adjunta fotos (DNI, licencia de negocio, selfie con documento).
              Solo imágenes JPG, PNG o WEBP — máximo {MAX_DOCS}. Un admin
              revisa manualmente en menos de 48 h.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {urls.length === 0 && (
            <button
              type="button"
              onClick={handlePick}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant/50 bg-surface-container/40 px-6 py-10 text-on-surface-variant transition hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={28} className="animate-spin text-primary" />
              ) : (
                <Upload size={28} className="text-primary" strokeWidth={1.6} />
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-on-surface">
                  {uploading ? "Subiendo…" : "Subir documento"}
                </p>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Solo imágenes (JPG · PNG · WEBP) · máx {MAX_DOCS}
                </p>
              </div>
            </button>
          )}

          {urls.length > 0 && (
            <div className="space-y-2">
              {urls.map((url, i) => {
                const isImg = /\.(png|jpe?g|webp|gif)$/i.test(url);
                return (
                  <div
                    key={url}
                    className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-2"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {isImg ? (
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <ImageIcon
                            size={20}
                            className="text-on-surface-variant"
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-semibold text-on-surface">
                        Documento {i + 1}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-on-surface-variant">
                        {url.split("/").pop()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger/10"
                      aria-label="Eliminar documento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {urls.length < MAX_DOCS && (
                <button
                  type="button"
                  onClick={handlePick}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/50 px-3 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Añadir otro ({MAX_DOCS - urls.length} restantes)
                </button>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && (
          <p className="border-t border-danger/30 bg-danger/10 px-5 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant/30 px-5 py-3">
          <p className="text-xs text-on-surface-variant">
            <strong className="text-on-surface">{urls.length}</strong> /{" "}
            {MAX_DOCS} docs adjuntos
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Enviar solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
