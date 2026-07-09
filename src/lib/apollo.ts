import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GRAPHQL_URL, TOKEN_KEY, ADMIN_TOKEN_KEY } from "./config";

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

const authLink = setContext((_, { headers }) => {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    // Admin routes use their own session; everything else uses the shop session.
    const inAdmin = window.location.pathname.startsWith("/admin");
    token = inAdmin
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : localStorage.getItem(TOKEN_KEY);
  }
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});
