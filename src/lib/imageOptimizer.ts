export interface OptimizeOpts {
  /** Max size in pixels for the longer side. Default 1600. */
  maxDim?: number;
  /** JPEG quality 0..1. Default 0.85. */
  quality?: number;
  /**
   * Target aspect ratio (width / height) for a centered crop. Skips any
   * cropper UI and does a deterministic center-crop. Common values:
   *   1        → avatar (square)
   *   16 / 9   → cover / hero
   */
  targetAspect?: number;
}

/**
 * Web equivalent of the RN `optimizeImage`: downscale + recompress a picked
 * photo so it stays under a couple hundred KB without visible quality loss.
 * A 12 MP JPEG (~5 MB) comes out around 300–500 KB at 1600px / q=0.85 —
 * plenty for a marketplace listing and well below any server-side cap.
 *
 * Uses `<canvas>` + `HTMLImageElement` decode, all in the browser. Falls
 * back to returning the original File on any decoding error so the upload
 * can still be attempted (the server cap is the last defense).
 *
 * Returns a new `File` (image/jpeg) with the same name (extension changed
 * to .jpg) so downstream code can treat it identically to the picked one.
 */
export async function optimizeImage(
  input: File,
  opts: OptimizeOpts = {},
): Promise<File> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.85;

  if (typeof window === "undefined" || !input.type.startsWith("image/")) {
    return input;
  }

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(input);
    const img = await loadImage(objectUrl);

    // 1) Compute the source rectangle (crop) once we know real pixel dims.
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (opts.targetAspect && sw > 0 && sh > 0) {
      const sourceAspect = sw / sh;
      if (Math.abs(sourceAspect - opts.targetAspect) > 0.01) {
        if (sourceAspect > opts.targetAspect) {
          // Too wide → trim the sides.
          const cropW = Math.round(sh * opts.targetAspect);
          sx = Math.floor((sw - cropW) / 2);
          sw = cropW;
        } else {
          // Too tall → trim top+bottom.
          const cropH = Math.round(sw / opts.targetAspect);
          sy = Math.floor((sh - cropH) / 2);
          sh = cropH;
        }
      }
    }

    // 2) Compute the destination canvas dimensions (never upscale).
    let dw = sw;
    let dh = sh;
    if (sw > maxDim || sh > maxDim) {
      if (sw >= sh) {
        dw = maxDim;
        dh = Math.round((sh * maxDim) / sw);
      } else {
        dh = maxDim;
        dw = Math.round((sw * maxDim) / sh);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return input;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return input;

    const baseName = input.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return input;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
