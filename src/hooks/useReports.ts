import { useMutation } from "@apollo/client/react";
import { CREATE_REPORT } from "@/graphql/mutations";

export type ReportType = "product" | "user";

export interface CreateReportInput {
  type: ReportType;
  reason: string;
  description?: string;
  productId?: string;
  reportedUserId?: string;
}

/** Report a product or another user. Requires an authenticated session. */
export function useReports() {
  const [mut, { loading }] = useMutation(CREATE_REPORT);
  const createReport = (input: CreateReportInput) =>
    mut({ variables: { input } });
  return { createReport, loading };
}
