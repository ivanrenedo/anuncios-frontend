"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_HOME_SECTIONS } from "@/graphql/queries";
import { TRACK_HOME_SECTION_EVENT } from "@/graphql/mutations";
import { getViewerKey } from "@/lib/viewer";
import { useCallback } from "react";

export interface HomeSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  filter?: any;
  config?: any;
  sortOrder?: number;
  products?: any[];
}

export function useHomeSections() {
  const viewerKey =
    typeof window !== "undefined" ? getViewerKey() : "";

  const { data, loading, error } = useQuery(GET_HOME_SECTIONS, {
    variables: { viewerKey: viewerKey || undefined },
    fetchPolicy: "cache-and-network",
  });

  const [trackMutation] = useMutation(TRACK_HOME_SECTION_EVENT);

  const sections: HomeSection[] = (data as any)?.homeSections ?? [];

  const trackEvent = useCallback(
    (sectionId: string, event: string) => {
      if (!viewerKey) return;
      trackMutation({
        variables: { sectionId, event, viewerKey },
      }).catch(() => {});
    },
    [trackMutation, viewerKey],
  );

  return { sections, loading, error, trackEvent };
}
