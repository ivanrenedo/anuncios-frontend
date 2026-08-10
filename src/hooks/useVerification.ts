import { useQuery, useMutation } from "@apollo/client/react";
import { MY_VERIFICATION_REQUEST } from "@/graphql/queries";
import { REQUEST_VERIFICATION } from "@/graphql/mutations";

export function useVerificationRequest() {
  const { data, loading, refetch } = useQuery<any>(MY_VERIFICATION_REQUEST, {
    fetchPolicy: "cache-and-network",
  });
  return {
    request: data?.myVerificationRequest ?? null,
    loading,
    refetch,
  };
}

export function useRequestVerification() {
  const [mutate, { loading }] = useMutation(REQUEST_VERIFICATION, {
    refetchQueries: ["MyVerificationRequest"],
    awaitRefetchQueries: true,
  });
  return {
    // v2 (Fase 10c): acepta URLs de documentos que se guardan en
    // VerificationRequest.docs para que el admin los vea en /admin/verifications.
    requestVerification: (docs?: string[]) =>
      mutate({ variables: { input: docs?.length ? { docs } : null } }),
    loading,
  };
}
