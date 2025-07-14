export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const apiPath = url.pathname + url.search; // Include query params like ?ref=master or ?recursive=1
    const target = `https://api.github.com${apiPath}`;

    let accept = 'application/vnd.github+json'; // Default to JSON for structure/metadata
    if (url.searchParams.has('raw')) {
      accept = 'application/vnd.github.v3.raw'; // Override for raw file content
    }

    const resp = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept: accept,
        'User-Agent': 'gh-proxy-worker', // Required
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      redirect: 'follow',
    });

    const body = await resp.text(); // Use text() for easier decoding/wrapping (assumes text-based content like JSON/MD)

    // Wrap in HTML
    const htmlBody = `<html><body><pre>${body}</pre></body></html>`;

    return new Response(htmlBody, {
      status: resp.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}