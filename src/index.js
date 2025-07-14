export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const apiPath = url.pathname + url.search;
    const target = `https://api.github.com${apiPath}`;

    let accept = 'application/vnd.github+json';
    if (url.searchParams.has('raw')) {
      accept = 'application/vnd.github.v3.raw';
    }

    const resp = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `token ${env.GITHUB_TOKEN}`,
        Accept: accept,
        'User-Agent': 'gh-proxy-worker',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      redirect: 'follow',
    });

    let body = await resp.text();

    // Pretty print if JSON
    if (accept === 'application/vnd.github+json' && resp.headers.get('content-type').includes('application/json')) {
      try {
        const jsonObj = JSON.parse(body);
        body = JSON.stringify(jsonObj, null, 2);
      } catch (e) {
        // If not valid JSON, leave as is
      }
    }

    const htmlBody = `<html><body><h1>GitHub Proxy Response for ${url.pathname}</h1><pre>${body}</pre></body></html>`;

    return new Response(htmlBody, {
      status: resp.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}