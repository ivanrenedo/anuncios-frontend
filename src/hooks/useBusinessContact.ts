import { useQuery } from "@apollo/client/react";
import { BUSINESS_CONTACT } from "@/graphql/queries";

const FALLBACK = {
  phone: "240222626418",
  email: "digitalcorps365@gmail.com",
};

interface BusinessContact {
  phone: string;
  email: string;
}

/**
 * Contact info for the business account, fetched from the backend and cached
 * by Apollo across pages. Values default to hardcoded fallbacks so buttons
 * that build a `wa.me` / `mailto:` URL never render an empty string while
 * the query is in flight or if the network fails.
 */
export function useBusinessContact() {
  const { data, loading, error } = useQuery<{
    businessContact: BusinessContact;
  }>(BUSINESS_CONTACT);
  const phone = data?.businessContact?.phone || FALLBACK.phone;
  const email = data?.businessContact?.email || FALLBACK.email;
  return { phone, email, loading, error };
}
