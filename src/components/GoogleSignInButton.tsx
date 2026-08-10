"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/config";
import type { GoogleProfile } from "@/hooks/useAuth";

declare global {
  interface Window {
    google?: any;
  }
}

/** Decode the profile claims from a Google ID-token JWT (no verification —
 *  the backend trusts the profile, same as the mobile app). */
function decodeJwt(token: string): Record<string, any> {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return {};
  }
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (profile: GoogleProfile) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Route callbacks through refs so a new closure identity from the parent
  // does not re-run the init effect (which would call
  // google.accounts.id.initialize() again — GIS warns about that).
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // Load the GIS script once.
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const existing = document.getElementById("gsi-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.id = "gsi-script";
    s.onload = () => setScriptReady(true);
    s.onerror = () => onErrorRef.current?.("No se pudo cargar Google Sign-In");
    document.head.appendChild(s);
  }, []);

  // Initialize + render the official button.
  useEffect(() => {
    if (!scriptReady || !ref.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: { credential?: string }) => {
        if (!resp.credential) {
          onErrorRef.current?.("No se recibió la credencial de Google");
          return;
        }
        const claims = decodeJwt(resp.credential);
        if (!claims.sub || !claims.email) {
          onErrorRef.current?.("Credencial de Google inválida");
          return;
        }
        onSuccessRef.current({
          id: claims.sub,
          email: claims.email,
          name: claims.name || claims.email,
          avatar: claims.picture || "",
        });
      },
    });

    window.google.accounts.id.renderButton(ref.current, {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 320,
    });
  }, [scriptReady]);

  return (
    <div className="flex justify-center">
      <div ref={ref} />
    </div>
  );
}
