import { NextResponse } from "next/server";

const ADS_TXT = "google.com, pub-2621121538375000, DIRECT, f08c47fec0942fa0\n";

export const dynamic = "force-static";

export function GET() {
  return new NextResponse(ADS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
