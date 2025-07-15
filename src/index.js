export default {
  async fetch(request, env, ctx) {
    console.log(`Incoming request: Method=${request.method}, URL=${request.url}, User-Agent=${request.headers.get('User-Agent') || 'unknown'}`);

    const url = new URL(request.url);
    const apiPath = url.pathname + url.search;
    const target = `https://api.github.com${apiPath}`;
    console.log(`Target GitHub API URL: ${target}`);

    let accept = 'application/vnd.github+json';
    if (url.searchParams.has('raw')) {
      accept = 'application/vnd.github.v3.raw';
    }
    console.log(`Accept header: ${accept}`);

    // Log CF metadata for diagnostics (bot score, IP, etc.)
    const cf = request.cf || {};
    console.log(`CF Metadata: Country=${cf.country || 'unknown'}, IP=${cf.clientIp || 'unknown'}, Bot Score=${(cf.bot_management ? cf.bot_management.score : 'not enabled') || 'unknown'}`);

    try {
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

      console.log(`GitHub Response Status: ${resp.status}`);

      let body = await resp.text();

      // Pretty print if JSON
      if (accept === 'application/vnd.github+json' && resp.headers.get('content-type').includes('application/json')) {
        try {
          const jsonObj = JSON.parse(body);
          body = JSON.stringify(jsonObj, null, 2);
        } catch (e) {
          console.error(`JSON parse error: ${e.message}`);
        }
      }

      const htmlBody = `<html><body><h1>GitHub Proxy Response for ${url.pathname}</h1><pre>${body}</pre></body></html>`;

      const r = new Response(htmlBody, {
        status: resp.status,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
        },
      });

      console.log(`R: ${r}`);

      return r;
    } catch (e) {
      console.error(`Fetch error: ${e.message}`);
      return new Response(`Error: ${e.message}`, { status: 500 });
    }
  }
}