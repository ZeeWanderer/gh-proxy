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

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const body = await resp.arrayBuffer();

    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*', // Add this for CORS
      },
    });
  }
}