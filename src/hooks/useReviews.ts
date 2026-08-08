import { useQuery, useMutation } from "@apollo/client/react";
import { REVIEWS_BY_SELLER, SELLER_RATING } from "@/graphql/queries";
import {
  CREATE_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW,
} from "@/graphql/mutations";

export function useReviewsBySeller(sellerId: string) {
  const { data, loading, error, refetch } = useQuery<any>(REVIEWS_BY_SELLER, {
    variables: { sellerId },
    skip: !sellerId,
  });
  return { reviews: data?.reviewsBySeller ?? [], loading, error, refetch };
}

export function useSellerRating(sellerId: string) {
  const { data, loading, refetch } = useQuery<any>(SELLER_RATING, {
    variables: { sellerId },
    skip: !sellerId,
  });
  return {
    average: data?.sellerRating?.average ?? 0,
    count: data?.sellerRating?.count ?? 0,
    loading,
    refetch,
  };
}

const REVIEW_QUERIES = ["ReviewsBySeller", "SellerRating"];

export function useCreateReview() {
  const [mutate, { loading, error }] = useMutation(CREATE_REVIEW, {
    refetchQueries: REVIEW_QUERIES,
    awaitRefetchQueries: true,
  });
  const create = (input: { sellerId: string; rating: number; text?: string }) =>
    mutate({ variables: { input } });
  return { create, loading, error };
}

export function useUpdateReview() {
  const [mutate, { loading }] = useMutation(UPDATE_REVIEW, {
    refetchQueries: REVIEW_QUERIES,
    awaitRefetchQueries: true,
  });
  const update = (id: string, input: { rating: number; text?: string }) =>
    mutate({ variables: { id, input } });
  return { update, loading };
}

export function useDeleteReview() {
  const [mutate, { loading }] = useMutation(DELETE_REVIEW, {
    refetchQueries: REVIEW_QUERIES,
    awaitRefetchQueries: true,
  });
  const remove = (id: string) => mutate({ variables: { id } });
  return { remove, loading };
}
