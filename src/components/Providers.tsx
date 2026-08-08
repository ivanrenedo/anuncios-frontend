"use client";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apollo";
import { AuthHydrator } from "@/hooks/useAuth";
import ThemeApplier from "@/components/ThemeApplier";
import PhoneVerificationGate from "@/components/PhoneVerificationGate";
import CookieConsent from "@/components/CookieConsent";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <ThemeApplier />
      <AuthHydrator />
      <PhoneVerificationGate />
      {children}
      {/* Banner de cookies + modal — se auto-oculta si el usuario ya ha
          decidido. También inicializa Google Consent Mode v2 al arrancar. */}
      <CookieConsent />
    </ApolloProvider>
  );
}
