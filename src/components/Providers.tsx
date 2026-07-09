"use client";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apollo";
import { AuthHydrator } from "@/hooks/useAuth";
import ThemeApplier from "@/components/ThemeApplier";
import PhoneVerificationGate from "@/components/PhoneVerificationGate";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <ThemeApplier />
      <AuthHydrator />
      <PhoneVerificationGate />
      {children}
    </ApolloProvider>
  );
}
