// iOS Universal Links — Apple App Site Association
// This file must be served at /.well-known/apple-app-site-association
// with Content-Type: application/json (no file extension).
//
// Replace TEAM_ID below with your actual Apple Developer Team ID.
// You can find it at https://developer.apple.com/account → Membership details.

export async function GET() {
  const association = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'TEAM_ID.com.yoombaa.app',
          paths: ['/lead/*'],
        },
      ],
    },
  };

  return new Response(JSON.stringify(association), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
