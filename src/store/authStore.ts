import { create } from "zustand";
import { client } from "@/lib/apollo";
import { ME } from "@/graphql/queries";
import { GOOGLE_LOGIN, REFRESH_TOKEN } from "@/graphql/mutations";
import { TOKEN_KEY } from "@/lib/config";

const REFRESH_TOKEN_KEY = "market_refresh_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  suspended?: boolean;
  avatarUrl?: string | null;
  verified?: boolean;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  permission?: string | null;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (profile: GoogleProfile) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  attemptTokenRefresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  refresh: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      set({ user: null, isAuthenticated: false, loading: false });
      return;
    }
    try {
      const { data } = await client.query({
        query: ME,
        fetchPolicy: "network-only",
      });
      const user = (data as { me: AuthUser } | null)?.me ?? null;
      set({ user, isAuthenticated: !!user, loading: false });
    } catch {
      const refreshed = await useAuthStore.getState().attemptTokenRefresh();
      if (!refreshed) {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    }
  },

  attemptTokenRefresh: async () => {
    const storedRefresh =
      typeof window !== "undefined"
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : null;
    if (!storedRefresh) return false;
    try {
      const { data } = await client.mutate({
        mutation: REFRESH_TOKEN,
        variables: { token: storedRefresh },
      });
      const result = (data as any)?.refreshToken;
      if (!result?.accessToken) return false;
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      }
      const { data: meData } = await client.query({
        query: ME,
        fetchPolicy: "network-only",
      });
      const user = (meData as { me: AuthUser } | null)?.me ?? null;
      set({ user, isAuthenticated: !!user, loading: false });
      return true;
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
  },

  loginWithGoogle: async (profile) => {
    const { data } = await client.mutate({
      mutation: GOOGLE_LOGIN,
      variables: {
        input: {
          googleId: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar ?? "",
        },
      },
    });
    const result = (data as any)?.googleLogin;
    const token = result?.accessToken;
    if (!token) throw new Error("No se pudo iniciar sesión");
    localStorage.setItem(TOKEN_KEY, token);
    if (result.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    }
    await useAuthStore.getState().refresh();
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ user: null, isAuthenticated: false });
    client.clearStore();
  },
}));
