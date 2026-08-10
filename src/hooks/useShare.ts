import { SHARE_URL } from "@/lib/config";

type ShareTarget =
  | { type: "product"; id: string; title: string; price: string }
  | { type: "profile"; id: string; name: string };

interface ShareResult {
  /** True when the share sheet (or clipboard copy) succeeded. */
  ok: boolean;
  /** True when we used the clipboard fallback because Web Share is
   *  unavailable — the caller may want to show a toast. */
  copied: boolean;
}

/**
 * Web-native share hook. All share links point at the public web domain so
 * that a single URL works everywhere: desktop browsers land on the Next.js
 * page, and phones with the app installed open it directly via Android App
 * Links / iOS Universal Links (declared in app.json + verified via the
 * .well-known files hosted by the web).
 *
 * Prefers the Web Share API (single sheet with system apps: WhatsApp, mail,
 * SMS, AirDrop). Falls back to `navigator.clipboard.writeText` when Web
 * Share isn't available (most desktops).
 */
export function useShare() {
  const share = async (target: ShareTarget): Promise<ShareResult> => {
    const { title, message, url } = buildPayload(target);

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text: message, url });
        return { ok: true, copied: false };
      } catch (err: any) {
        // AbortError = user closed the sheet; not an error worth reporting.
        if (err?.name === "AbortError") return { ok: false, copied: false };
        // Fall through to clipboard.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        return { ok: true, copied: true };
      } catch {
        return { ok: false, copied: false };
      }
    }
    return { ok: false, copied: false };
  };

  return { share };
}

function buildPayload(target: ShareTarget) {
  if (target.type === "product") {
    const url = `${SHARE_URL}/product/${target.id}`;
    return {
      title: target.title,
      message: `${target.title} — ${target.price}\n${url}`,
      url,
    };
  }
  const url = `${SHARE_URL}/user/${target.id}`;
  return {
    title: `${target.name} en Bomelh`,
    message: `Mira el perfil de ${target.name} en Bomelh\n${url}`,
    url,
  };
}
