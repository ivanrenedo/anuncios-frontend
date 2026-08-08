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
    requestVerification: () => mutate(),
    loading,
  };
}
