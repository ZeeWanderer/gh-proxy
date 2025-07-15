export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiPath = url.pathname + url.search;
    const target = `https://api.github.com${apiPath}`;
    console.log(`Incoming request: ${request.method} ${url.pathname}${url.search}`);
    if (request.method === "OPTIONS") {
      console.log("Handling CORS preflight");
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
          "Access-Control-Allow-Headers": "Authorization,Accept,Content-Type",
        },
      });
    }
    const wantRaw = url.searchParams.has("raw");
    console.log(`Want raw content: ${wantRaw}`);
    const accept = wantRaw
      ? "application/vnd.github.v3.raw"
      : "application/vnd.github+json";
    console.log(`Fetching from GitHub: ${target}`);
    const ghResp = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept: accept,
        "User-Agent": "gh-proxy-worker",
      },
      redirect: "follow",
    });
    console.log(`GitHub response status: ${ghResp.status}`);
    const body = await ghResp.arrayBuffer();
    const headers = new Headers(ghResp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    if (wantRaw) {
      console.log("Returning raw content");
      headers.set("Content-Type", ghResp.headers.get("content-type") || "text/plain");
      return new Response(body, {
        status: ghResp.status,
        headers,
      });
    }
    const text = new TextDecoder().decode(body);
    let pretty = text;
    if ((ghResp.headers.get("content-type") || "").includes("application/json")) {
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        console.error(`Error pretty-printing JSON: ${e.message}`);
      }
    }
    console.log("Returning JSON response");
    return new Response(pretty, {
      status: ghResp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}