/**
 * Extracts a clean, user-facing message from an Apollo/GraphQL/unknown error.
 *
 * Backend (NestJS) already returns friendly Spanish messages — this just pulls
 * the right field out of the error regardless of Apollo Client's shape
 * (v4 `CombinedGraphQLErrors.errors`, v3 `graphQLErrors`, network errors, …).
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Ha ocurrido un error. Inténtalo de nuevo.",
): string {
  const e = error as any;

  const gqlMessage =
    e?.graphQLErrors?.[0]?.message ??
    e?.errors?.[0]?.message ??
    e?.cause?.errors?.[0]?.message;
  if (typeof gqlMessage === "string" && gqlMessage.trim()) return gqlMessage;

  if (e?.networkError)
    return "Error de conexión. Revisa tu internet e inténtalo de nuevo.";

  if (typeof e?.message === "string" && e.message.trim()) return e.message;
  if (typeof error === "string" && error.trim()) return error;

  return fallback;
}
