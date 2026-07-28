import { NextResponse } from "next/server";

/**
 * Apple Universal Links manifest. iOS fetches this from
 * `https://bomelh.com/.well-known/apple-app-site-association` (no extension,
 * `application/json` content type) to decide whether tapping a bomelh.com
 * link should open the app instead of Safari.
 *
 * REPLACE `TODO_APPLE_TEAM_ID` with the 10-char Team ID from
 * https://developer.apple.com/account (Membership → Team ID).
 * Bundle id must match `ios.bundleIdentifier` in app.json.
 */
export const dynamic = "force-static";

export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "TODO_APPLE_TEAM_ID.com.guslift.com",
          paths: ["/product/*", "/user/*"],
        },
      ],
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
