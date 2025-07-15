export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiPath = url.pathname + url.search;          // includes ?ref=… and ?raw=1
    const target  = `https://api.github.com${apiPath}`;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  "*",
          "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
          "Access-Control-Allow-Headers": "Authorization,Accept,Content-Type",
        },
      });
    }

    // Determine if client asked for raw content
    const wantRaw = url.searchParams.has("raw");

    // Choose Accept header
    const accept = wantRaw
      ? "application/vnd.github.v3.raw"
      : "application/vnd.github+json";

    // Fetch from GitHub
    const ghResp = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept:        accept,
        "User-Agent":  "gh-proxy-worker",
      },
      redirect: "follow",
    });

    // Grab the raw body bytes
    const body = await ghResp.arrayBuffer();

    // Build response headers
    const headers = new Headers(ghResp.headers);
    headers.set("Access-Control-Allow-Origin", "*");

    // If this is raw markdown, override content-type to a text subtype
    if (wantRaw) {
      headers.set("Content-Type", ghResp.headers.get("content-type") || "text/plain");
      return new Response(body, {
        status: ghResp.status,
        headers,
      });
    }

    // Otherwise (JSON metadata) just re‑serialize it
    const text = new TextDecoder().decode(body);
    let pretty = text;
    if ((ghResp.headers.get("content-type")||"").includes("application/json")) {
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
    }
    return new Response(pretty, {
      status: ghResp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
