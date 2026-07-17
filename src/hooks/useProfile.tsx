"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ME } from "@/graphql/queries";
import { UPDATE_USER, DELETE_MY_ACCOUNT } from "@/graphql/mutations";
import { useAuth } from "./useAuth";
import type { UserProfile } from "@/lib/types";

export function useProfile() {
  const { isAuthenticated } = useAuth();

  const { data, loading, refetch } = useQuery(ME, {
    skip: !isAuthenticated,
    fetchPolicy: "cache-and-network",
  });

  const profile: UserProfile | null = (data as any)?.me ?? null;

  const [updateMutation] = useMutation(UPDATE_USER, {
    refetchQueries: ["Me"],
    awaitRefetchQueries: true,
  });

  const [deleteMutation] = useMutation(DELETE_MY_ACCOUNT);

  const updateProfile = useCallback(
    async (input: Record<string, unknown>) => {
      await updateMutation({ variables: { input } });
    },
    [updateMutation],
  );

  const refreshProfile = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const deleteAccount = useCallback(async () => {
    await deleteMutation();
  }, [deleteMutation]);

  return { profile, loading, updateProfile, refreshProfile, deleteAccount };
}
