import { create } from "zustand";
import { client } from "@/lib/apollo";
import { ME } from "@/graphql/queries";
import { GOOGLE_LOGIN } from "@/graphql/mutations";
import { TOKEN_KEY } from "@/lib/config";

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
      set({ user: null, isAuthenticated: false, loading: false });
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
    const token = (data as any)?.googleLogin?.accessToken;
    if (!token) throw new Error("No se pudo iniciar sesión");
    localStorage.setItem(TOKEN_KEY, token);
    await useAuthStore.getState().refresh();
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, isAuthenticated: false });
    client.clearStore();
  },
}));
