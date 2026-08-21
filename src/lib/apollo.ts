import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  Observable,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import {
  ADMIN_AUTH_EVENT,
  ADMIN_TOKEN_KEY,
  GRAPHQL_URL,
  TOKEN_KEY,
} from "./config";

const REFRESH_TOKEN_KEY = "market_refresh_token";

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

const authLink = setContext((_, { headers }) => {
  let token: string | null = null;
  if (typeof window !== "undefined") {
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

let suspendedAlertShown = false;
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

export function resetSuspendedAlert() {
  suspendedAlertShown = false;
}

const errorLink = onError(({ graphQLErrors, operation, forward }: any) => {
  if (!graphQLErrors) return;

  const msgs: string[] = graphQLErrors.map((e: any) => e.message.toLowerCase());

  const suspended = msgs.some(
    (m) => m.includes("suspendida") || m.includes("suspended"),
  );
  if (suspended && !suspendedAlertShown) {
    suspendedAlertShown = true;
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.alert(
        "Tu cuenta ha sido suspendida. Si crees que es un error, contacta con soporte.",
      );
      client.clearStore().catch(() => {});
      window.location.href = "/";
    }
    return;
  }

  const unauthenticated = graphQLErrors.some(
    (e: any) =>
      e.extensions?.code === "UNAUTHENTICATED" ||
      msgs.some((m: string) => m.includes("unauthorized") || m.includes("jwt expired")),
  );
  if (!unauthenticated) return;

  const inAdmin =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");
  if (inAdmin) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
    return;
  }

  const storedRefresh =
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;
  if (!storedRefresh) return;

  if (isRefreshing) {
    return new Observable((observer) => {
      pendingRequests.push(() => {
        const sub = forward(operation).subscribe(observer);
        return () => sub.unsubscribe();
      });
    });
  }

  isRefreshing = true;

  return new Observable((observer) => {
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) { refreshToken(token: $token) { accessToken refreshToken } }`,
        variables: { token: storedRefresh },
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        const result = json?.data?.refreshToken;
        if (result?.accessToken) {
          localStorage.setItem(TOKEN_KEY, result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
          }
          operation.setContext(({ headers = {} }: any) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${result.accessToken}`,
            },
          }));
          pendingRequests.forEach((cb) => cb());
          pendingRequests = [];
          forward(operation).subscribe(observer);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          observer.error(graphQLErrors[0]);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        observer.error(graphQLErrors[0]);
      })
      .finally(() => {
        isRefreshing = false;
      });
  });
});

export const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: { merge: false },
          productsByCategory: { merge: false },
          productsBySeller: { merge: false },
          searchProducts: { merge: false },
          sectionProducts: { merge: false },
          homeSections: { merge: false },
          myFavorites: { merge: false },
          notifications: { merge: false },
          reviewsBySeller: { merge: false },
          followers: { merge: false },
          following: { merge: false },
          mySavedSearches: { merge: false },
          myAutoBumpSlots: { merge: false },
          pinnedProducts: { merge: false },
          homeCarouselPremium: { merge: false },
          categoryTree: { merge: false },
        },
      },
      ProductModel: {
        fields: {
          images: { merge: false },
          vehicleDetail: { merge: false },
          propertyDetail: { merge: false },
          serviceDetail: { merge: false },
          jobDetail: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all" as any,
    },
    query: { fetchPolicy: "network-only" },
  },
});
