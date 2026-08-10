import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_FOLLOWERS,
  GET_FOLLOWING,
  IS_FOLLOWING,
  FOLLOWERS_COUNT,
  FOLLOWING_COUNT,
} from "@/graphql/queries";
import { FOLLOW_USER, UNFOLLOW_USER } from "@/graphql/mutations";

export function useFollowers(userId: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_FOLLOWERS, {
    variables: { userId },
    skip: !userId,
  });
  return { followers: data?.followers ?? [], loading, error, refetch };
}

export function useFollowing(userId: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_FOLLOWING, {
    variables: { userId },
    skip: !userId,
  });
  return { following: data?.following ?? [], loading, error, refetch };
}

export function useIsFollowing(userId: string) {
  const { data, loading, refetch } = useQuery<any>(IS_FOLLOWING, {
    variables: { userId },
    skip: !userId,
  });
  return { isFollowing: data?.isFollowing ?? false, loading, refetch };
}

export function useFollowersCount(userId: string) {
  const { data, loading, refetch } = useQuery<any>(FOLLOWERS_COUNT, {
    variables: { userId },
    skip: !userId,
  });
  return { count: data?.followersCount ?? 0, loading, refetch };
}

export function useFollowingCount(userId: string) {
  const { data, loading, refetch } = useQuery<any>(FOLLOWING_COUNT, {
    variables: { userId },
    skip: !userId,
  });
  return { count: data?.followingCount ?? 0, loading, refetch };
}

const FOLLOW_QUERIES = [
  "Followers",
  "Following",
  "FollowersCount",
  "FollowingCount",
  "IsFollowing",
];

export function useFollowToggle() {
  const [followMut] = useMutation(FOLLOW_USER, {
    refetchQueries: FOLLOW_QUERIES,
    awaitRefetchQueries: true,
  });
  const [unfollowMut] = useMutation(UNFOLLOW_USER, {
    refetchQueries: FOLLOW_QUERIES,
    awaitRefetchQueries: true,
  });

  const follow = (userId: string) => followMut({ variables: { userId } });
  const unfollow = (userId: string) => unfollowMut({ variables: { userId } });

  return { follow, unfollow };
}
